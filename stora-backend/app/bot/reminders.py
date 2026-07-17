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
