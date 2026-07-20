from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from aiogram.types import LabeledPrice


def _build_channel_candidates(channel_username: str) -> list[str]:
    if not channel_username:
        return []

    identifier = str(channel_username).strip()
    if not identifier:
        return []

    if identifier.lstrip("-").isdigit():
        return [identifier]

    candidates: list[str] = []
    seen: set[str] = set()

    def add_candidate(value: str) -> None:
        cleaned = value.strip()
        if not cleaned or cleaned in seen:
            return
        seen.add(cleaned)
        candidates.append(cleaned)

    add_candidate(identifier)
    if identifier.startswith("@"):
        add_candidate(identifier[1:])
    else:
        add_candidate(f"@{identifier}")

    base = identifier[1:] if identifier.startswith("@") else identifier
    normalized = base.replace("_", "").replace("-", "")
    if normalized != base:
        add_candidate(normalized)
        add_candidate(f"@{normalized}")

    return candidates


async def is_user_subscribed_to_channel(bot_client, telegram_id: int, channel_username: str) -> bool:
    for candidate in _build_channel_candidates(channel_username):
        try:
            member = await bot_client.get_chat_member(chat_id=candidate, user_id=telegram_id)
        except Exception:
            continue

        if getattr(member, "status", None) in {"member", "administrator", "creator"}:
            return True

    return False

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.crud import user_crud
from app.config import settings
from app.bot.bot_instance import bot

router = APIRouter(prefix="/api/credits", tags=["credits"])


@router.get("/balance")
async def get_balance(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await user_crud.refresh_subscription_status(db, tg_user["id"])
    if not user:
        raise HTTPException(404, "User not found")
    return {
        "credits": user["credits"],
        "plan": user.get("plan", "free"),
        "subscription_expires_at": user.get("subscription_expires_at"),
    }


@router.post("/daily-bonus")
async def claim_daily_bonus(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    updated = await user_crud.claim_daily_bonus(db, tg_user["id"])
    if not updated:
        raise HTTPException(400, "Daily bonus already claimed. Try again later.")
    from datetime import datetime, timedelta
    next_claim_at = (updated["last_daily_claim"] + timedelta(hours=24)).isoformat()
    return {"credits": updated["credits"], "claimed": settings.DAILY_BONUS_CREDITS, "next_claim_at": next_claim_at}


@router.post("/subscribe-bonus")
async def claim_subscribe_bonus(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Frontend calls this after the user taps 'Subscribe'. The backend must
    verify membership in the official channel before crediting anything.
    """
    user = await user_crud.get_user(db, tg_user["id"])
    if user.get("subscribe_bonus_claimed"):
        raise HTTPException(400, "Already claimed")

    channel_username = settings.OFFICIAL_CHANNEL_USERNAME
    if not await is_user_subscribed_to_channel(bot, tg_user["id"], channel_username):
        raise HTTPException(400, "You must join the official channel first before claiming this reward.")

    updated = await user_crud.adjust_credits(db, tg_user["id"], settings.SUBSCRIBE_BONUS_CREDITS)
    if not updated:
        raise HTTPException(400, "Could not credit subscribe bonus")

    await db.users.update_one({"telegram_id": tg_user["id"]}, {"$set": {"subscribe_bonus_claimed": True}})
    return {"credits": updated["credits"], "claimed": settings.SUBSCRIBE_BONUS_CREDITS}


@router.post("/watch-ad")
async def claim_ad_reward(
    reward_amount: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Called after the Adsgram/Giga Pub SDK confirms a completed rewarded
    view on the frontend. In production, verify the ad SDK's server-side
    callback/postback here instead of trusting the client value blindly.
    """
    updated = await user_crud.adjust_credits(db, tg_user["id"], reward_amount)
    if not updated:
        raise HTTPException(400, "Could not credit reward")
    return {"credits": updated["credits"]}


@router.post("/invite/{invited_telegram_id}")
async def claim_invite_bonus(
    invited_telegram_id: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Called when a referred user completes onboarding (triggered from the bot side)."""
    updated = await user_crud.adjust_credits(db, tg_user["id"], settings.INVITE_BONUS_CREDITS)
    if not updated:
        raise HTTPException(400, "Could not credit invite bonus")
    return {"credits": updated["credits"], "claimed": settings.INVITE_BONUS_CREDITS}


@router.post("/unlimited/create-invoice")
async def create_unlimited_plan_invoice(
    tg_user: dict = Depends(get_current_telegram_user),
):
    stars_cost = settings.UNLIMITED_PLAN_STARS_COST
    payload = f"unlimited_{tg_user['id']}"

    try:
        invoice_link = await bot.create_invoice_link(
            title="Stora Unlimited",
            description="Unlock unlimited saving, zero credit drain, and no ads for one month.",
            payload=payload,
            provider_token="",
            currency="XTR",
            prices=[LabeledPrice(label="Stora Unlimited", amount=stars_cost)],
        )
    except Exception:
        raise HTTPException(400, "Couldn't create invoice. Try again later.")

    if hasattr(invoice_link, "url"):
        invoice_url = getattr(invoice_link, "url")
    elif isinstance(invoice_link, dict):
        invoice_url = invoice_link.get("url") or invoice_link.get("invoice_link") or str(invoice_link)
    else:
        invoice_url = str(invoice_link)

    return {
        "plan": "unlimited",
        "stars_cost": stars_cost,
        "payload": payload,
        "invoice_link": invoice_url,
        "period_days": settings.UNLIMITED_PLAN_DURATION_DAYS,
    }


@router.post("/topup/create-invoice")
async def create_topup_invoice(
    credit_amount: int,
    tg_user: dict = Depends(get_current_telegram_user),
):
    """
    Creates a real Telegram Stars invoice link. Stars payments use
    currency 'XTR' and an EMPTY provider_token string — aiogram's
    create_invoice_link requires the param be passed explicitly even
    though Stars don't use a real payment provider.
    """
    if credit_amount <= 0:
        raise HTTPException(400, "credit_amount must be a positive number of credits")
    if credit_amount > 100000:
        raise HTTPException(400, "That's more credits than we can process in one purchase")

    stars_cost = credit_amount * settings.STARS_TO_CREDITS_RATE
    payload = f"topup_{tg_user['id']}_{credit_amount}"

    try:
        invoice_link = await bot.create_invoice_link(
            title=f"{credit_amount} Stora Credits",
            description=f"Top up your Stora balance with {credit_amount} credits.",
            payload=payload,
            provider_token="",  # empty string required for Telegram Stars (XTR)
            currency="XTR",
            prices=[LabeledPrice(label=f"{credit_amount} credits", amount=stars_cost)],
        )
    except Exception as e:
        # Normalize error for the client — avoid leaking internal traceback.
        raise HTTPException(400, "Couldn't create invoice. Try again later.")

    # aiogram may return an object or mapping for the invoice link depending
    # on version; ensure we return a plain string URL that WebApp.openInvoice
    # expects (some clients reject non-string values and return
    # WebAppInvoiceUrlInvalid).
    if hasattr(invoice_link, "url"):
        invoice_url = getattr(invoice_link, "url")
    elif isinstance(invoice_link, dict):
        invoice_url = invoice_link.get("url") or invoice_link.get("invoice_link") or str(invoice_link)
    else:
        invoice_url = str(invoice_link)

    return {
        "credit_amount": credit_amount,
        "stars_cost": stars_cost,
        "payload": payload,
        "invoice_link": invoice_url,
    }