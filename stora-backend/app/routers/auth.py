import logging

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.models.user import UserCreate, UserOut, OnboardingRequest
from app.crud import user_crud
from app.bot.bot_instance import bot
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_out(user_doc: dict) -> UserOut:
    return UserOut(
        telegram_id=user_doc["telegram_id"],
        username=user_doc.get("username"),
        first_name=user_doc.get("first_name"),
        photo_url=user_doc.get("photo_url"),
        language=user_doc.get("language", "en"),
        timezone=user_doc.get("timezone"),
        is_onboarded=user_doc.get("is_onboarded", False),
        credits=user_doc.get("credits", 0),
        plan=user_doc.get("plan", "free"),
        subscription_expires_at=user_doc.get("subscription_expires_at"),
        last_daily_claim=user_doc.get("last_daily_claim"),
        subscribe_bonus_claimed=user_doc.get("subscribe_bonus_claimed", False),
    )


@router.post("/session", response_model=UserOut)
async def start_session(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Called once when the Mini App launches. Creates the user if new,
    returns their current state (including onboarding status).
    """
    user_create = UserCreate(
        telegram_id=tg_user["id"],
        username=tg_user.get("username"),
        first_name=tg_user.get("first_name"),
        photo_url=tg_user.get("photo_url"),
        language=tg_user.get("language_code", "en"),
    )
    user_doc, is_new = await user_crud.create_user(db, user_create)

    # Always sync the latest Telegram profile data so name/photo changes show immediately
    if not is_new:
        profile_update = {
            "username": tg_user.get("username"),
            "first_name": tg_user.get("first_name"),
            "photo_url": tg_user.get("photo_url"),
            "language": tg_user.get("language_code", user_doc.get("language", "en")),
        }
        # Only write if something actually changed (avoids unnecessary DB writes)
        if any(user_doc.get(k) != v for k, v in profile_update.items()):
            await db.users.update_one(
                {"telegram_id": tg_user["id"]},
                {"$set": profile_update},
            )
            user_doc = await user_crud.get_user(db, tg_user["id"])

    user_doc = await user_crud.refresh_subscription_status(db, tg_user["id"])
    return _to_user_out(user_doc)


@router.post("/onboarding/configure", response_model=UserOut)
async def configure_channel(
    payload: OnboardingRequest,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Validates that:
    1. The bot is an admin in the pasted channel_id
    2. The channel isn't already bound to another user
    Then marks onboarding complete.
    """
    existing_owner = await db.users.find_one({"private_channel_id": payload.channel_id})
    if existing_owner and existing_owner["telegram_id"] != tg_user["id"]:
        raise HTTPException(400, "This channel is already linked to another Stora account.")

    # Normalize channel ID
    c_id_str = payload.channel_id.strip()
    if c_id_str.isdigit():
        c_id_str = f"-100{c_id_str}"
    elif c_id_str.startswith("-") and not c_id_str.startswith("-100"):
        c_id_str = f"-100{c_id_str[1:]}"
    
    try:
        chat_id_int = int(c_id_str)
    except ValueError:
        raise HTTPException(400, "Invalid Channel ID format. Must be numeric.")

    try:
        member = await bot.get_chat_member(chat_id=chat_id_int, user_id=bot.id)
    except Exception as e:
        import logging
        logging.error(f"Error validating channel {chat_id_int}: {e}")
        raise HTTPException(400, f"Couldn't find that channel. Check the Channel ID and try again. (Debug: {str(e)})")

    if member.status not in ("administrator", "creator"):
        raise HTTPException(400, "Stora bot must be an admin in that channel.")

    # Fetch user BEFORE marking onboarding complete so we can read referred_by
    current_user = await user_crud.get_user(db, tg_user["id"])
    user_doc = await user_crud.complete_onboarding(db, tg_user["id"], payload.channel_id)

    if settings.ADMIN_TELEGRAM_ID:
        try:
            await bot.send_message(
                chat_id=settings.ADMIN_TELEGRAM_ID,
                text=(
                    "🔔 <b>New onboarding completed</b>\n\n"
                    f"User: <b>{tg_user.get('first_name') or tg_user.get('username') or tg_user['id']}</b>\n"
                    f"Telegram ID: <code>{tg_user['id']}</code>\n"
                    f"Channel ID: <code>{payload.channel_id}</code>"
                ),
                parse_mode="HTML",
            )
        except Exception as exc:
            logger.warning("Failed to notify admin about onboarding completion: %s", exc)

    # --- Referral reward: credit referrer and notify them via bot ---
    referrer_id: int | None = (current_user or {}).get("referred_by")
    if referrer_id:
        referrer_doc = await user_crud.credit_referrer(db, referrer_id)
        if referrer_doc:
            new_balance = referrer_doc["credits"]
            referee_name = tg_user.get("first_name") or tg_user.get("username") or "Someone"
            try:
                await bot.send_message(
                    chat_id=referrer_id,
                    text=(
                        f"🎉 <b>Referral reward!</b>\n\n"
                        f"<b>{referee_name}</b> just joined Stora using your invite link and has "
                        f"completed onboarding.\n\n"
                        f"✅ <b>+{settings.INVITE_BONUS_CREDITS} Stora Credits</b> have been added to your balance.\n"
                        f"💰 Your new balance: <b>{new_balance} credits</b>"
                    ),
                    parse_mode="HTML",
                )
            except Exception as e:
                # Non-fatal — log and continue even if the notification fails
                logger.warning(f"Failed to send referral notification to {referrer_id}: {e}")

    return _to_user_out(user_doc)
