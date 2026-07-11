from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.models.user import UserCreate, UserOut, OnboardingRequest
from app.crud import user_crud
from app.bot.bot_instance import bot

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
    user_doc = await user_crud.create_user(db, user_create)
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

    try:
        member = await bot.get_chat_member(chat_id=payload.channel_id, user_id=bot.id)
    except Exception:
        raise HTTPException(400, "Couldn't find that channel. Check the Channel ID and try again.")

    if member.status not in ("administrator", "creator"):
        raise HTTPException(400, "Stora bot must be an admin in that channel.")

    user_doc = await user_crud.complete_onboarding(db, tg_user["id"], payload.channel_id)
    return _to_user_out(user_doc)
