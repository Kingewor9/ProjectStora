from datetime import datetime, timedelta
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserCreate, UserInDB
from app.config import settings


async def get_user(db: AsyncIOMotorDatabase, telegram_id: int) -> Optional[dict]:
    return await db.users.find_one({"telegram_id": telegram_id})


async def create_user(
    db: AsyncIOMotorDatabase,
    user: UserCreate,
    referred_by: Optional[int] = None,
) -> Tuple[dict, bool]:
    """
    Returns (user_doc, is_new).
    `is_new` is True only when the user was just inserted for the first time.
    """
    existing = await get_user(db, user.telegram_id)
    if existing:
        return existing, False

    user_doc = UserInDB(
        **user.model_dump(),
        credits=settings.STARTING_CREDITS,
        referred_by=referred_by,
    ).model_dump()

    await db.users.insert_one(user_doc)
    return await get_user(db, user.telegram_id), True


async def credit_referrer(db: AsyncIOMotorDatabase, referrer_id: int) -> Optional[dict]:
    """Award invite bonus to the referrer. Returns updated referrer doc or None if not found."""
    return await adjust_credits(db, referrer_id, settings.INVITE_BONUS_CREDITS)


async def complete_onboarding(db: AsyncIOMotorDatabase, telegram_id: int, channel_id: str) -> dict:
    await db.users.update_one(
        {"telegram_id": telegram_id},
        {"$set": {"private_channel_id": channel_id, "is_onboarded": True}},
    )
    return await get_user(db, telegram_id)


async def update_language(db: AsyncIOMotorDatabase, telegram_id: int, language: str) -> dict:
    await db.users.update_one({"telegram_id": telegram_id}, {"$set": {"language": language}})
    return await get_user(db, telegram_id)


async def adjust_credits(db: AsyncIOMotorDatabase, telegram_id: int, amount: int) -> Optional[dict]:
    """
    Positive amount = credit, negative = debit.
    Returns None if debit would drop balance below 0 (insufficient funds).
    """
    user = await get_user(db, telegram_id)
    if not user:
        return None

    new_balance = user["credits"] + amount
    if new_balance < 0:
        return None

    await db.users.update_one({"telegram_id": telegram_id}, {"$set": {"credits": new_balance}})
    return await get_user(db, telegram_id)


async def can_claim_daily_bonus(db: AsyncIOMotorDatabase, telegram_id: int) -> bool:
    user = await get_user(db, telegram_id)
    if not user or not user.get("last_daily_claim"):
        return True
    return datetime.utcnow() - user["last_daily_claim"] >= timedelta(hours=24)


async def claim_daily_bonus(db: AsyncIOMotorDatabase, telegram_id: int) -> Optional[dict]:
    if not await can_claim_daily_bonus(db, telegram_id):
        return None

    await db.users.update_one(
        {"telegram_id": telegram_id},
        {
            "$inc": {"credits": settings.DAILY_BONUS_CREDITS},
            "$set": {"last_daily_claim": datetime.utcnow()},
        },
    )
    return await get_user(db, telegram_id)
