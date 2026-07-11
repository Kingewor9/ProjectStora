"""
Single Bot + Dispatcher instance, imported both by run_bot.py (polling/
webhook entrypoint) and by the FastAPI routers that need to call the
bot directly (e.g. forwarding a file back to a user's DM).
"""

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.config import settings

bot = Bot(
    token=settings.BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML),
)

dp = Dispatcher()
