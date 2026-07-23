import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.crud import share_crud

logger = logging.getLogger(__name__)


async def schedule_sync_notifications(db: AsyncIOMotorDatabase, owner_id: int, folder_id: str) -> None:
    """
    Called when a file is saved to a folder. Finds all active shares for this
    folder (or its ancestors) where owner_id == user_id, and for each completed
    claim, pushes a sync notification pending task.
    """
    try:
        # Traverse up from folder_id to find all ancestor folders
        current_id = folder_id
        path_ids = []
        while current_id:
            path_ids.append(current_id)
            # Find the parent of the current folder
            folder_doc = await db.folders.find_one({"_id": share_crud._oid(current_id)})
            if not folder_doc:
                break
            current_id = folder_doc.get("parent_id")
        
        # Check if any folder in the path is actively shared by this owner
        shares_cursor = db.shares.find({
            "owner_id": owner_id,
            "folder_id": {"$in": path_ids},
            "revoked": False
        })
        active_shares = await shares_cursor.to_list(length=None)
        
        for share in active_shares:
            # Find all completed claims for this share
            claims_cursor = db.share_claims.find({"token": share["token"]})
            claims = await claims_cursor.to_list(length=None)
            
            for claim in claims:
                if claim.get("status") in ["completed", "in_progress", "delta"]:
                    # Upsert into sync_notifications
                    await db.sync_notifications.update_one(
                        {"token": share["token"], "claimed_by": claim["claimed_by"]},
                        {
                            "$set": {
                                "last_activity": datetime.utcnow(),
                                "status": "pending"
                            }
                        },
                        upsert=True
                    )
    except Exception as exc:
        logger.error(f"Failed to schedule sync notifications for folder {folder_id}: {exc}")
