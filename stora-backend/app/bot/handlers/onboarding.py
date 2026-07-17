import logging

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.filters.command import CommandObject
from aiogram.types import Message

from app.database import get_db
from app.bot.keyboards import open_app_keyboard, open_shared_folder_keyboard
from app.crud import user_crud
from app.models.user import UserCreate
from app.config import settings

logger = logging.getLogger(__name__)
router = Router(name="onboarding")


@router.message(CommandStart())
async def handle_start(message: Message, command: CommandObject):
    db = get_db()

    # Parse deep-link args: /start ref_123456789 or /start share_<token>
    referred_by: int | None = None
    share_token: str | None = None

    if command.args:
        args = command.args.strip()
        if args.startswith("ref_"):
            try:
                referred_by = int(args[4:])
                if referred_by == message.from_user.id:
                    referred_by = None  # prevent self-referral
            except ValueError:
                logger.warning(f"Invalid referral arg: {args!r}")
        elif args.startswith("share_"):
            share_token = args[6:]

    user_create = UserCreate(
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
    )
    user_doc, _ = await user_crud.create_user(db, user_create, referred_by=referred_by)
    await user_crud.mark_onboarding_started(db, message.from_user.id)

    if share_token:
        if user_doc.get("is_onboarded"):
            # Already set up — skip straight to the shared folder, no detour needed.
            await message.answer(
                "You've been invited to view a shared folder on Stora \U0001F4C1",
                reply_markup=open_shared_folder_keyboard(share_token),
            )
            return
        else:
            # Stash it — configure_channel will hand it back once onboarding finishes.
            await user_crud.set_pending_share_token(db, message.from_user.id, share_token)
            text = (
                "You've been invited to a shared folder on Stora \U0001F4C1\n\n"
                "Finish setting up your own vault first, then we'll take you "
                "straight there:\n\n"
                "1. Create a new private Telegram channel\n"
                "2. Add <b>@Storaofficial_bot</b> as an admin in that channel\n"
                "3. Get your Channel ID using @userinfobot\n"
                "4. Open the app below and paste the Channel ID to finish setup"
            )
            await message.answer(text, reply_markup=open_app_keyboard())
            return

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
