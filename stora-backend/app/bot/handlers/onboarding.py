from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from app.database import get_db
from app.bot.keyboards import open_app_keyboard
from app.crud import user_crud
from app.models.user import UserCreate

router = Router(name="onboarding")


@router.message(CommandStart())
async def handle_start(message: Message):
    db = get_db()

    user_create = UserCreate(
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
    )
    user_doc = await user_crud.create_user(db, user_create)

    if user_doc.get("is_onboarded"):
        text = "Welcome back to Stora! Tap below to open your vault."
    else:
        text = (
            "Welcome to Stora \U0001F4E6\n\n"
            "Before you start storing files, let's set up your private vault:\n\n"
            "1. Create a new private Telegram channel\n"
            "2. Add <b>@Storaofficial_bot</b> as an admin in that channel\n"
            "3. Get your Channel ID using @userinfobot\n"
            "4. Open the app below and paste the Channel ID to finish setup"
        )

    await message.answer(text, reply_markup=open_app_keyboard())
