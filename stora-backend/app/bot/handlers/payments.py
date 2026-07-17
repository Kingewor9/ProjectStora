"""
Telegram Stars payment flow — two update types to handle:

1. pre_checkout_query: Telegram asks "should this payment go through?"
   right before charging the user. MUST be answered within 10 seconds
   or the payment is cancelled automatically.

2. successful_payment: fires as a regular Message once the payment
   actually completes. This is where we credit the user's balance.

Both arrive through the existing update stream (polling or webhook —
whichever the bot is already using), so nothing new to deploy here.
"""

from datetime import datetime

from aiogram import Router, F
from aiogram.types import PreCheckoutQuery, Message

from app.database import get_db
from app.crud import user_crud
from app.config import settings

router = Router(name="payments")


@router.pre_checkout_query()
async def handle_pre_checkout(pre_checkout_query: PreCheckoutQuery):
    # For Stars top-ups there's nothing extra to validate (no stock/shipping
    # concerns), so we approve unconditionally. Reject with a reason string
    # here if you ever need to block a payment before it's charged.
    await pre_checkout_query.answer(ok=True)


@router.message(F.successful_payment)
async def handle_successful_payment(message: Message):
    db = get_db()
    payment = message.successful_payment
    payload = getattr(payment, "invoice_payload", "") or ""

    if payload.startswith("unlimited_"):
        try:
            _, telegram_id_str = payload.split("_", 1)
            telegram_id = int(telegram_id_str)
        except (ValueError, AttributeError):
            await message.answer(
                "Payment received, but we couldn't match it to your account automatically. "
                "Contact support with your payment details."
            )
            return

        updated_user = await user_crud.subscribe_to_unlimited_plan(
            db,
            telegram_id,
            settings.UNLIMITED_PLAN_DURATION_DAYS,
        )
        if updated_user:
            expires_at = updated_user.get("subscription_expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            formatted = expires_at.strftime("%b %d, %Y") if isinstance(expires_at, datetime) else "soon"
            await message.answer(
                "🎉 Stora Unlimited is now active! You can save files without spending credits until "
                f"{formatted}."
            )
        else:
            await message.answer(
                "Payment received, but activating Stora Unlimited failed. Contact support — "
                f"reference: {payment.telegram_payment_charge_id}"
            )
        return

    # payload was set as f"topup_{telegram_id}_{credit_amount}" when the
    # invoice link was created in credits.py
    try:
        _, telegram_id_str, credit_amount_str = payload.split("_")
        telegram_id = int(telegram_id_str)
        credit_amount = int(credit_amount_str)
    except (ValueError, AttributeError):
        await message.answer(
            "Payment received, but we couldn't match it to your account automatically. "
            "Contact support with your payment details."
        )
        return

    updated_user = await user_crud.adjust_credits(db, telegram_id, credit_amount)

    if updated_user:
        await message.answer(
            f"Payment received! +{credit_amount} credits added. "
            f"New balance: {updated_user['credits']} credits."
        )
    else:
        await message.answer(
            "Payment received, but crediting your account failed. Contact support — "
            f"reference: {payment.telegram_payment_charge_id}"
        )