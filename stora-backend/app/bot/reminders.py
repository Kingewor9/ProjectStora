import asyncio
import logging
from datetime import datetime, timedelta

from app.bot.bot_instance import bot
from app.bot.keyboards import open_app_keyboard
from app.config import settings
from app.crud import user_crud
from app.database import get_db

logger = logging.getLogger(__name__)


async def send_onboarding_followup(user_doc: dict) -> None:
    telegram_id = user_doc.get("telegram_id")
    if not telegram_id:
        return

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text=(
                "You’re almost there! Finish setting up your Stora vault so you can start storing files safely."
                "\n\nTap below to open the app and complete onboarding."
            ),
            reply_markup=open_app_keyboard(),
            parse_mode="HTML",
        )
    except Exception as exc:
        logger.warning("Failed to send onboarding follow-up to %s: %s", telegram_id, exc)
        return

    db = get_db()
    if db is not None:
        await user_crud.record_onboarding_followup_sent(db, telegram_id)


async def start_followup_scheduler(interval_seconds: int = 60) -> None:
    while True:
        try:
            db = get_db()
            if db is None:
                await asyncio.sleep(interval_seconds)
                continue

            due_users = await user_crud.get_due_onboarding_followups(db)
            for user_doc in due_users:
                await send_onboarding_followup(user_doc)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Onboarding follow-up scheduler crashed")

        await asyncio.sleep(interval_seconds)


async def send_sync_notification(db, notif_doc: dict) -> None:
    token = notif_doc.get("token")
    claimed_by = notif_doc.get("claimed_by")
    logger.info("[sync] Processing notification: token=%s claimed_by=%s", token, claimed_by)

    if not token or not claimed_by:
        logger.warning("[sync] Skipping notification — missing token or claimed_by")
        return

    share = await db.shares.find_one({"token": token})
    if not share:
        logger.warning("[sync] Share not found for token=%s, skipping", token)
        return
        
    from bson import ObjectId
    owner = await db.users.find_one({"telegram_id": share["owner_id"]})
    try:
        folder = await db.folders.find_one({"_id": ObjectId(share["folder_id"])})
    except Exception as exc:
        logger.error("[sync] Failed to look up folder for share token=%s: %s", token, exc)
        folder = None
    
    if not owner or not folder:
        logger.warning("[sync] owner=%s or folder=%s not found, skipping", owner, folder)
        return

    owner_name = owner.get("first_name") or owner.get("username") or "A user"
    folder_name = folder.get("name", "a folder")
    logger.info("[sync] Sending notification to %s: '%s' added files to '%s'", claimed_by, owner_name, folder_name)

    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
    sync_btn = InlineKeyboardButton(
        text="🔄 Sync New Files",
        web_app=WebAppInfo(url=f"{settings.FRONTEND_URL}/#/shared/{token}")
    )
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[sync_btn]])

    try:
        await bot.send_message(
            chat_id=claimed_by,
            text=(
                f"📁 <b>{owner_name}</b> just added new file(s) to <b>{folder_name}</b>, "
                "which they shared with you.\n\nTap below to sync them to your vault."
            ),
            reply_markup=keyboard,
            parse_mode="HTML",
        )
        logger.info("[sync] Notification sent successfully to %s", claimed_by)
    except Exception as exc:
        logger.warning("[sync] Failed to send sync notification to %s: %s", claimed_by, exc)


async def start_sync_scheduler(interval_seconds: int = 60) -> None:
    while True:
        try:
            db = get_db()
            if db is None:
                await asyncio.sleep(interval_seconds)
                continue

            # Temporarily reduced to 15 seconds for testing
            threshold = datetime.utcnow() - timedelta(seconds=15)
            
            cursor = db.sync_notifications.find({
                "status": "pending",
                "last_activity": {"$lt": threshold}
            })
            
            due_notifs = await cursor.to_list(length=None)
            if due_notifs:
                logger.info("[sync] Scheduler found %d due notifications", len(due_notifs))
            for notif_doc in due_notifs:
                await send_sync_notification(db, notif_doc)
                await db.sync_notifications.update_one(
                    {"_id": notif_doc["_id"]},
                    {"$set": {"status": "sent", "sent_at": datetime.utcnow()}}
                )
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("[sync] Sync notification scheduler crashed")

        await asyncio.sleep(interval_seconds)
