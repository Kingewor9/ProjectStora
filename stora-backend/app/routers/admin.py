import asyncio
import logging

from aiogram.exceptions import TelegramRetryAfter, TelegramForbiddenError, TelegramBadRequest
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from fastapi import APIRouter, BackgroundTasks, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import require_admin
from app.models.broadcast import BroadcastRequest, BroadcastStarted
from app.bot.bot_instance import bot

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


def _build_keyboard(payload: BroadcastRequest) -> InlineKeyboardMarkup | None:
    if not payload.link_url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=payload.cta_text, url=payload.link_url)]]
    )


async def _send_one(chat_id: int, payload: BroadcastRequest, keyboard: InlineKeyboardMarkup | None) -> bool:
    """Sends to a single chat. Returns True on success, False on any
    permanent failure (blocked bot, deactivated account, bad chat, etc.)."""
    try:
        if payload.image_url:
            await bot.send_photo(
                chat_id=chat_id,
                photo=payload.image_url,
                caption=payload.text,
                parse_mode="HTML",
                reply_markup=keyboard,
            )
        else:
            await bot.send_message(
                chat_id=chat_id,
                text=payload.text,
                parse_mode="HTML",
                reply_markup=keyboard,
                disable_web_page_preview=True,
            )
        return True
    except TelegramRetryAfter as e:
        # Global flood-control hit — wait as instructed, then retry once.
        await asyncio.sleep(e.retry_after + 0.5)
        try:
            return await _send_one(chat_id, payload, keyboard)
        except Exception:
            return False
    except (TelegramForbiddenError, TelegramBadRequest):
        # User blocked the bot, deleted their account, or chat is otherwise gone.
        return False
    except Exception as exc:
        logger.warning(f"Broadcast send failed for {chat_id}: {exc}")
        return False


async def _run_broadcast(user_ids: list[int], payload: BroadcastRequest, admin_id: int) -> None:
    keyboard = _build_keyboard(payload)
    sent = 0
    failed = 0

    for i, chat_id in enumerate(user_ids):
        ok = await _send_one(chat_id, payload, keyboard)
        if ok:
            sent += 1
        else:
            failed += 1

        # Stay comfortably under Telegram's ~30 msg/sec global limit.
        if (i + 1) % 20 == 0:
            await asyncio.sleep(1)
        else:
            await asyncio.sleep(0.05)

    try:
        await bot.send_message(
            chat_id=admin_id,
            text=(
                "📢 <b>Broadcast complete</b>\n\n"
                f"✅ Sent: {sent}\n"
                f"❌ Failed: {failed}\n"
                f"👥 Total recipients: {len(user_ids)}"
            ),
            parse_mode="HTML",
        )
    except Exception as exc:
        logger.warning(f"Failed to notify admin of broadcast completion: {exc}")


@router.post("/broadcast", response_model=BroadcastStarted)
async def send_broadcast(
    payload: BroadcastRequest,
    background_tasks: BackgroundTasks,
    admin: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Fires immediately in the background — sending to every user can take
    a while (rate-limited to stay under Telegram's flood limits), so this
    responds right away and DMs the admin a sent/failed summary once done.
    """
    user_ids = await db.users.distinct("telegram_id")
    background_tasks.add_task(_run_broadcast, user_ids, payload, admin["id"])
    return BroadcastStarted(status="started", total_recipients=len(user_ids))
