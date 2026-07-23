import logging
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.models.share import ShareCreate, ShareOut, SharePreview
from app.crud import share_crud, folder_crud, user_crud
from app.config import settings
from app.bot.bot_instance import bot

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/shares", tags=["shares"])


@router.post("", response_model=ShareOut)
async def create_share(
    payload: ShareCreate,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    folder = await folder_crud.get_folder(db, payload.folder_id, tg_user["id"])
    if not folder:
        raise HTTPException(404, "Folder not found")

    share = await share_crud.create_or_reuse_share(db, tg_user["id"], payload.folder_id)
    return ShareOut(
        token=share["token"],
        share_link=f"https://t.me/{settings.BOT_USERNAME}?start=share_{share['token']}",
        folder_id=share["folder_id"],
        folder_name=folder["name"],
        revoked=share["revoked"],
        created_at=share["created_at"],
    )


@router.post("/{token}/revoke")
async def revoke_share(
    token: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    revoked = await share_crud.revoke_share(db, token, tg_user["id"])
    if not revoked:
        raise HTTPException(404, "Share not found")
    return {"status": "revoked"}


@router.get("/{token}", response_model=SharePreview)
async def preview_share(
    token: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Read-only preview — names, counts, and cost only. Deliberately does
    NOT require onboarding, so B can see what's waiting before finishing
    setup. Never exposes telegram_msg_link.
    """
    share = await share_crud.get_share_by_token(db, token)
    if not share:
        raise HTTPException(404, "This share link doesn't exist.")

    owner = await user_crud.get_user(db, share["owner_id"])
    if not owner:
        raise HTTPException(404, "Share owner not found")

    claim = await share_crud.get_claim(db, token, tg_user["id"])
    claim_status = claim["status"] if claim else None
    claimed_root_folder_id = claim.get("root_folder_id") if claim else None

    root_node, total_files, total_folders = await share_crud.build_preview_tree(
        db, share["owner_id"], share["folder_id"], claim
    )
    if root_node is None:
        raise HTTPException(404, "This shared folder no longer exists.")
        
    if claim_status == "completed" and total_files > 0:
        claim_status = "delta"

    cost_credits = total_files * settings.SAVE_FILE_COST

    requester = await user_crud.refresh_subscription_status(db, tg_user["id"])
    requester_is_unlimited = await user_crud.is_unlimited_active(requester) if requester else False
    requester_credits = requester["credits"] if requester else 0
    can_afford = requester_is_unlimited or requester_credits >= cost_credits

    return SharePreview(
        token=token,
        owner_name=owner.get("first_name") or owner.get("username") or "A Stora user",
        revoked=share["revoked"],
        root=root_node,
        total_files=total_files,
        total_folders=total_folders,
        cost_credits=cost_credits,
        requester_is_unlimited=requester_is_unlimited,
        requester_credits=requester_credits,
        can_afford=can_afford,
        claim_status=claim_status,
        claimed_root_folder_id=claimed_root_folder_id,
    )


@router.post("/{token}/claim")
async def claim_share(
    token: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        claim = await share_crud.execute_claim(db, token, tg_user["id"], bot)
    except PermissionError as e:
        raise HTTPException(402, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception:
        logger.exception("Unexpected error while claiming share %s for %s", token, tg_user["id"])
        raise HTTPException(500, "Something went wrong while claiming this folder. Try again.")

    # Notify the owner, best-effort — mirrors the referral-credit notification pattern.
    if claim["status"] == "completed":
        try:
            share = await share_crud.get_share_by_token(db, token)
            folder = await folder_crud.get_folder(db, share["folder_id"], share["owner_id"])
            claimer_name = tg_user.get("first_name") or tg_user.get("username") or "Someone"
            await bot.send_message(
                chat_id=share["owner_id"],
                text=(
                    f"📁 <b>{claimer_name}</b> just claimed your shared folder "
                    f"\"{folder['name'] if folder else 'a folder'}\"."
                ),
                parse_mode="HTML",
            )
        except Exception as exc:
            logger.warning("Failed to notify share owner: %s", exc)

    return {
        "status": claim["status"],
        "root_folder_id": claim.get("root_folder_id"),
        "copied_count": len(claim["copied_file_ids"]),
        "total_files": claim["total_files"],
        "total_cost_charged": claim["total_cost_charged"],
    }


@router.get("", response_model=list[ShareOut])
async def list_my_shares(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    shares = await share_crud.list_shares_by_owner(db, tg_user["id"])
    out = []
    for share in shares:
        folder = await folder_crud.get_folder(db, share["folder_id"], tg_user["id"])
        if not folder:
            continue
        out.append(ShareOut(
            token=share["token"],
            share_link=f"https://t.me/{settings.BOT_USERNAME}?start=share_{share['token']}",
            folder_id=share["folder_id"],
            folder_name=folder["name"],
            revoked=share["revoked"],
            created_at=share["created_at"],
        ))
    return out
