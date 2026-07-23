import logging
import secrets
from datetime import datetime
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.share import ShareInDB, SharePreviewFolder, SharePreviewFile, ShareClaimInDB
from app.models.folder import FolderCreate
from app.models.file import FileCreate
from app.crud import folder_crud, file_crud, user_crud
from app.config import settings

logger = logging.getLogger(__name__)


def _oid(id_str: str):
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise ValueError(f"Invalid id: {id_str}")


# --- Share link lifecycle ---

async def get_active_share_for_folder(db: AsyncIOMotorDatabase, owner_id: int, folder_id: str) -> Optional[dict]:
    return await db.shares.find_one({"owner_id": owner_id, "folder_id": folder_id, "revoked": False})


async def get_share_by_token(db: AsyncIOMotorDatabase, token: str) -> Optional[dict]:
    return await db.shares.find_one({"token": token})


async def create_or_reuse_share(db: AsyncIOMotorDatabase, owner_id: int, folder_id: str) -> dict:
    """One active share link per folder — re-tapping 'Share' on the same
    folder returns the existing link instead of proliferating new ones."""
    existing = await get_active_share_for_folder(db, owner_id, folder_id)
    if existing:
        return existing

    for _ in range(5):
        token = secrets.token_urlsafe(9)
        if await get_share_by_token(db, token):
            continue
        doc = ShareInDB(token=token, owner_id=owner_id, folder_id=folder_id).model_dump()
        await db.shares.insert_one(doc)
        return await get_share_by_token(db, token)

    raise RuntimeError("Could not generate a unique share token")


async def revoke_share(db: AsyncIOMotorDatabase, token: str, owner_id: int) -> bool:
    result = await db.shares.update_one(
        {"token": token, "owner_id": owner_id}, {"$set": {"revoked": True}}
    )
    return result.modified_count > 0


async def list_shares_by_owner(db: AsyncIOMotorDatabase, owner_id: int) -> list[dict]:
    cursor = db.shares.find({"owner_id": owner_id, "revoked": False}).sort("created_at", -1)
    return await cursor.to_list(length=None)


async def get_shared_folder_ids(db: AsyncIOMotorDatabase, owner_id: int, folder_ids: list[str]) -> set[str]:
    """Batch check — which of these folder ids currently have an active share."""
    if not folder_ids:
        return set()
    cursor = db.shares.find({"owner_id": owner_id, "folder_id": {"$in": folder_ids}, "revoked": False})
    docs = await cursor.to_list(length=None)
    return {d["folder_id"] for d in docs}


# --- Preview tree building (names only, no telegram_msg_link exposed) ---

async def _build_preview_node(db: AsyncIOMotorDatabase, owner_id: int, folder_doc: dict, by_parent: dict, claim: Optional[dict] = None) -> Optional[SharePreviewFolder]:
    folder_id = str(folder_doc["_id"])
    files = await file_crud.list_files_in_folder(db, folder_id, owner_id)
    
    if claim and claim.get("status") == "completed":
        copied_file_ids = set(claim.get("copied_file_ids", []))
        before = len(files)
        files = [f for f in files if str(f["_id"]) not in copied_file_ids]
        logger.info("[preview] folder=%s files before=%d after=%d (delta filter)", folder_id, before, len(files))

    child_folders = by_parent.get(folder_id, [])

    subfolders = []
    for child in child_folders:
        sub_node = await _build_preview_node(db, owner_id, child, by_parent, claim)
        if sub_node and (sub_node.files or sub_node.subfolders):
            subfolders.append(sub_node)
            
    if claim and claim.get("status") == "completed" and not files and not subfolders:
        logger.info("[preview] folder=%s has no delta files, returning None", folder_id)
        return None

    return SharePreviewFolder(
        name=folder_doc["name"],
        files=[SharePreviewFile(name=f["file_name"], file_type=f["file_type"]) for f in files],
        subfolders=subfolders,
    )


async def build_preview_tree(db: AsyncIOMotorDatabase, owner_id: int, root_folder_id: str, claim: Optional[dict] = None):
    """Returns (root_preview_node, total_files, total_folders) or (None, 0, 0) if folder missing."""
    subtree = await folder_crud.get_folder_subtree(db, owner_id, root_folder_id)
    if not subtree:
        return None, 0, 0

    by_parent: dict[str, list[dict]] = {}
    for f in subtree:
        parent = f.get("parent_id")
        if parent:
            by_parent.setdefault(parent, []).append(f)

    root_doc = subtree[0]
    root_node = await _build_preview_node(db, owner_id, root_doc, by_parent, claim)
    
    if not root_node:
        root_node = SharePreviewFolder(name=root_doc["name"], files=[], subfolders=[])

    total_files = sum(_count_files(root_node) for _ in [None])
    total_folders = len(subtree)
    return root_node, total_files, total_folders


def _count_files(node: SharePreviewFolder) -> int:
    return len(node.files) + sum(_count_files(child) for child in node.subfolders)


# --- Claim tracking ---

async def get_claim(db: AsyncIOMotorDatabase, token: str, claimed_by: int) -> Optional[dict]:
    return await db.share_claims.find_one({"token": token, "claimed_by": claimed_by})


async def create_claim(
    db: AsyncIOMotorDatabase,
    token: str,
    owner_id: int,
    claimed_by: int,
    total_files: int,
    total_cost_charged: int,
    pending_file_ids: list[str],
) -> dict:
    doc = ShareClaimInDB(
        token=token,
        owner_id=owner_id,
        claimed_by=claimed_by,
        total_files=total_files,
        total_cost_charged=total_cost_charged,
        pending_file_ids=pending_file_ids,
    ).model_dump()
    await db.share_claims.insert_one(doc)
    return await get_claim(db, token, claimed_by)


async def update_claim(db: AsyncIOMotorDatabase, token: str, claimed_by: int, update: dict) -> None:
    update["updated_at"] = datetime.utcnow()
    await db.share_claims.update_one(
        {"token": token, "claimed_by": claimed_by}, {"$set": update}
    )


# --- The actual copy operation ---

async def execute_claim(db: AsyncIOMotorDatabase, token: str, claimed_by_id: int, bot) -> dict:
    """
    Core Model A operation: recreate A's folder tree under B, then forward
    each file's message from A's channel into B's channel, creating new
    File docs owned by B. Resumable — safe to call again after a partial
    failure; already-copied files and the already-charged cost aren't
    repeated.
    """
    share = await get_share_by_token(db, token)
    if not share or share.get("revoked"):
        raise ValueError("This share link is no longer available.")

    owner_id = share["owner_id"]
    if owner_id == claimed_by_id:
        raise ValueError("You can't claim your own folder.")

    claimer = await user_crud.get_user(db, claimed_by_id)
    if not claimer or not claimer.get("private_channel_id"):
        raise ValueError("Finish onboarding before claiming a shared folder.")

    existing_claim = await get_claim(db, token, claimed_by_id)

    if existing_claim and existing_claim["status"] == "completed":
        subtree = await folder_crud.get_folder_subtree(db, owner_id, share["folder_id"])
        all_files: list[dict] = []
        for folder_doc in subtree:
            all_files.extend(await file_crud.list_files_in_folder(db, str(folder_doc["_id"]), owner_id))
            
        copied_file_ids = set(existing_claim.get("copied_file_ids", []))
        uncopied_files = [f for f in all_files if str(f["_id"]) not in copied_file_ids]
        
        if not uncopied_files:
            return existing_claim  # idempotent — already fully claimed
            
        total_cost = len(uncopied_files) * settings.SAVE_FILE_COST
        user = await user_crud.refresh_subscription_status(db, claimed_by_id)
        is_unlimited = await user_crud.is_unlimited_active(user)

        if not is_unlimited and user["credits"] < total_cost:
            raise PermissionError(
                f"You need {total_cost} credits to claim the new files, but you only have {user['credits']}."
            )

        charged_user = await user_crud.adjust_credits(db, claimed_by_id, -total_cost)
        if charged_user is None:
            raise PermissionError("Couldn't charge credits for the new files. Try again.")

        actual_cost_charged = 0 if is_unlimited else total_cost
        
        folder_id_map = existing_claim.get("folder_id_map", {})
        for folder_doc in subtree:
            original_id = str(folder_doc["_id"])
            if original_id not in folder_id_map:
                original_parent = folder_doc.get("parent_id")
                new_parent_id = folder_id_map.get(original_parent) if original_parent else None
                new_folder = await folder_crud.create_folder(
                    db, claimed_by_id, FolderCreate(name=folder_doc["name"], parent_id=new_parent_id, is_claimed=True)
                )
                folder_id_map[original_id] = str(new_folder["_id"])
                
        await update_claim(db, token, claimed_by_id, {
            "status": "in_progress",
            "folder_id_map": folder_id_map,
            "total_files": existing_claim["total_files"] + len(uncopied_files),
            "total_cost_charged": existing_claim["total_cost_charged"] + actual_cost_charged,
            "pending_file_ids": existing_claim.get("pending_file_ids", []) + [str(f["_id"]) for f in uncopied_files]
        })
        claim = await get_claim(db, token, claimed_by_id)
    elif existing_claim:
        # Resume: folders + charge already exist, just keep copying files.
        claim = existing_claim
    else:
        # Fresh claim — compute cost, check affordability, charge once upfront.
        subtree = await folder_crud.get_folder_subtree(db, owner_id, share["folder_id"])
        if not subtree:
            raise ValueError("This shared folder no longer exists.")

        all_files: list[dict] = []
        for folder_doc in subtree:
            all_files.extend(await file_crud.list_files_in_folder(db, str(folder_doc["_id"]), owner_id))

        total_cost = len(all_files) * settings.SAVE_FILE_COST

        user = await user_crud.refresh_subscription_status(db, claimed_by_id)
        is_unlimited = await user_crud.is_unlimited_active(user)

        if not is_unlimited and user["credits"] < total_cost:
            raise PermissionError(
                f"You need {total_cost} credits to claim this folder, but you only have {user['credits']}."
            )

        charged_user = await user_crud.adjust_credits(db, claimed_by_id, -total_cost)
        if charged_user is None:
            raise PermissionError("Couldn't charge credits for this claim. Try again.")

        actual_cost_charged = 0 if is_unlimited else total_cost

        # Recreate the folder tree under B (parent-first order, since
        # subtree is already root-first from get_folder_subtree's BFS).
        folder_id_map: dict[str, str] = {}
        for folder_doc in subtree:
            original_id = str(folder_doc["_id"])
            original_parent = folder_doc.get("parent_id")
            new_parent_id = folder_id_map.get(original_parent) if original_parent else None

            new_folder = await folder_crud.create_folder(
                db, claimed_by_id, FolderCreate(name=folder_doc["name"], parent_id=new_parent_id, is_claimed=True)
            )
            folder_id_map[original_id] = str(new_folder["_id"])

        pending_file_ids = [str(f["_id"]) for f in all_files]

        claim = await create_claim(
            db,
            token=token,
            owner_id=owner_id,
            claimed_by=claimed_by_id,
            total_files=len(all_files),
            total_cost_charged=actual_cost_charged,
            pending_file_ids=pending_file_ids,
        )
        await update_claim(db, token, claimed_by_id, {
            "root_folder_id": folder_id_map[str(subtree[0]["_id"])],
            "folder_id_map": folder_id_map,
        })
        claim = await get_claim(db, token, claimed_by_id)

    # --- Copy files (resumable: only processes what's still pending) ---
    folder_id_map = claim["folder_id_map"]
    copied_file_ids = list(claim["copied_file_ids"])
    pending_file_ids = list(claim["pending_file_ids"])
    owner_channel_id = (await user_crud.get_user(db, owner_id))["private_channel_id"]
    claimer_channel_id = claimer["private_channel_id"]

    for original_file_id in list(pending_file_ids):
        original_file = await file_crud.get_file(db, original_file_id, owner_id)
        if not original_file:
            # Source file vanished (deleted by A mid-claim) — skip it, don't block the rest.
            pending_file_ids.remove(original_file_id)
            continue

        try:
            forwarded = await bot.forward_message(
                chat_id=claimer_channel_id,
                from_chat_id=owner_channel_id,
                message_id=original_file["telegram_message_id"],
            )
        except Exception:
            # Stop here — leave remaining files pending for a retry.
            break

        new_folder_id = folder_id_map.get(original_file["folder_id"])
        if not new_folder_id:
            pending_file_ids.remove(original_file_id)
            continue

        await file_crud.create_file(db, FileCreate(
            user_id=claimed_by_id,
            folder_id=new_folder_id,
            file_name=original_file["file_name"],
            file_type=original_file["file_type"],
            telegram_msg_link=f"https://t.me/c/{str(claimer_channel_id).replace('-100', '')}/{forwarded.message_id}",
            telegram_message_id=forwarded.message_id,
            file_size=original_file.get("file_size"),
        ))

        copied_file_ids.append(original_file_id)
        pending_file_ids.remove(original_file_id)

    status = "completed" if not pending_file_ids else "in_progress"
    await update_claim(db, token, claimed_by_id, {
        "copied_file_ids": copied_file_ids,
        "pending_file_ids": pending_file_ids,
        "status": status,
    })

    if status == "completed":
        import asyncio
        from app.crud.sync_crud import schedule_sync_notifications
        asyncio.create_task(schedule_sync_notifications(db, claimed_by_id, claim["root_folder_id"]))

    return await get_claim(db, token, claimed_by_id)
