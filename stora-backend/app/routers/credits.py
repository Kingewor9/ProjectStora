from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.crud import user_crud
from app.config import settings

router = APIRouter(prefix="/api/credits", tags=["credits"])


@router.get("/balance")
async def get_balance(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await user_crud.get_user(db, tg_user["id"])
    if not user:
        raise HTTPException(404, "User not found")
    return {"credits": user["credits"]}


@router.post("/daily-bonus")
async def claim_daily_bonus(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    updated = await user_crud.claim_daily_bonus(db, tg_user["id"])
    if not updated:
        raise HTTPException(400, "Daily bonus already claimed. Try again later.")
    return {"credits": updated["credits"], "claimed": settings.DAILY_BONUS_CREDITS}


@router.post("/subscribe-bonus")
async def claim_subscribe_bonus(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Frontend calls this after the user taps 'Subscribe'. Backend should
    verify membership via bot.get_chat_member before crediting — wire that
    check in once OFFICIAL_CHANNEL_USERNAME is live.
    """
    user = await user_crud.get_user(db, tg_user["id"])
    if user.get("subscribe_bonus_claimed"):
        raise HTTPException(400, "Already claimed")

    updated = await user_crud.adjust_credits(db, tg_user["id"], settings.SUBSCRIBE_BONUS_CREDITS)
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


@router.post("/topup/create-invoice")
async def create_topup_invoice(
    credit_amount: int,
    tg_user: dict = Depends(get_current_telegram_user),
):
    """
    Creates a real Telegram Stars invoice link. Stars payments use
    currency 'XTR' and require NO provider_token (unlike normal
    Telegram Payments) — that's what makes Stars different to set up.
    """
    if credit_amount <= 0:
        raise HTTPException(400, "credit_amount must be positive")
 
    stars_cost = credit_amount * settings.STARS_TO_CREDITS_RATE
    payload = f"topup_{tg_user['id']}_{credit_amount}"
 
    invoice_link = await bot.create_invoice_link(
        title=f"{credit_amount} Stora Credits",
        description=f"Top up your Stora balance with {credit_amount} credits.",
        payload=payload,
        currency="XTR",
        prices=[LabeledPrice(label=f"{credit_amount} credits", amount=stars_cost)],
    )
 
    return {
        "credit_amount": credit_amount,
        "stars_cost": stars_cost,
        "payload": payload,
        "invoice_link": invoice_link,
    }
 