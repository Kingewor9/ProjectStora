from datetime import datetime, timedelta
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

FIRST_FOLLOWUP_DELAY = timedelta(hours=2)
FOLLOWUP_REPEAT_INTERVAL = timedelta(hours=48)

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
        {
            "$set": {
                "private_channel_id": channel_id,
                "is_onboarded": True,
                "onboarding_completed_at": datetime.utcnow(),
            }
        },
    )
    return await get_user(db, telegram_id)


async def mark_onboarding_started(db: AsyncIOMotorDatabase, telegram_id: int) -> dict:
    user = await get_user(db, telegram_id)
    if user and user.get("onboarding_started_at"):
        return user

    await db.users.update_one(
        {"telegram_id": telegram_id},
        {"$set": {"onboarding_started_at": datetime.utcnow()}},
    )
    return await get_user(db, telegram_id)


async def record_onboarding_followup_sent(db: AsyncIOMotorDatabase, telegram_id: int) -> dict:
    await db.users.update_one(
        {"telegram_id": telegram_id},
        {"$set": {"onboarding_followup_sent_at": datetime.utcnow()}},
    )
    return await get_user(db, telegram_id)


async def get_due_onboarding_followups(db: AsyncIOMotorDatabase, now: Optional[datetime] = None) -> list[dict]:
    now = now or datetime.utcnow()
    cutoff = now - FIRST_FOLLOWUP_DELAY
    repeat_cutoff = now - FOLLOWUP_REPEAT_INTERVAL

    cursor = db.users.find(
        {
            "is_onboarded": False,
            "$or": [
                {
                    "onboarding_started_at": {"$lte": cutoff},
                    "onboarding_followup_sent_at": None,
                },
                {
                    "onboarding_followup_sent_at": {"$lte": repeat_cutoff},
                },
            ],
        }
    )

    if hasattr(cursor, "__aiter__"):
        return [doc async for doc in cursor]
    return [doc for doc in await cursor]


async def update_language(db: AsyncIOMotorDatabase, telegram_id: int, language: str) -> dict:
    await db.users.update_one({"telegram_id": telegram_id}, {"$set": {"language": language}})
    return await get_user(db, telegram_id)


async def set_pending_share_token(db: AsyncIOMotorDatabase, telegram_id: int, token: str) -> None:
    """Stashes a share invite so it survives the onboarding detour — read
    and cleared once by configure_channel after onboarding completes."""
    await db.users.update_one(
        {"telegram_id": telegram_id}, {"$set": {"pending_share_token": token}}
    )


async def pop_pending_share_token(db: AsyncIOMotorDatabase, telegram_id: int) -> Optional[str]:
    user = await get_user(db, telegram_id)
    token = user.get("pending_share_token") if user else None
    if token:
        await db.users.update_one(
            {"telegram_id": telegram_id}, {"$unset": {"pending_share_token": ""}}
        )
    return token


async def refresh_subscription_status(db: AsyncIOMotorDatabase, telegram_id: int) -> Optional[dict]:
    user = await get_user(db, telegram_id)
    if not user:
        return None

    expires_at = user.get("subscription_expires_at")
    if user.get("plan") == "unlimited" and expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at <= datetime.utcnow():
            await db.users.update_one(
                {"telegram_id": telegram_id},
                {"$set": {"plan": "free", "subscription_expires_at": None}},
            )
            return await get_user(db, telegram_id)

    return user


async def subscribe_to_unlimited_plan(db: AsyncIOMotorDatabase, telegram_id: int, duration_days: int = 30) -> Optional[dict]:
    user = await refresh_subscription_status(db, telegram_id)
    if not user:
        return None

    expires_at = datetime.utcnow() + timedelta(days=duration_days)
    await db.users.update_one(
        {"telegram_id": telegram_id},
        {"$set": {"plan": "unlimited", "subscription_expires_at": expires_at}},
    )
    return await get_user(db, telegram_id)


async def is_unlimited_active(user: Optional[dict]) -> bool:
    if not user or user.get("plan") != "unlimited":
        return False

    expires_at = user.get("subscription_expires_at")
    if not expires_at:
        return False

    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)

    return expires_at > datetime.utcnow()


async def adjust_credits(db: AsyncIOMotorDatabase, telegram_id: int, amount: int) -> Optional[dict]:
    """
    Positive amount = credit, negative = debit.
    Returns None if debit would drop balance below 0 (insufficient funds).
    """
    user = await refresh_subscription_status(db, telegram_id)
    if not user:
        return None

    if amount < 0 and await is_unlimited_active(user):
        return user

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
