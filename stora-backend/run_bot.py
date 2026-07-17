"""
Runs the Telegram bot as its own process, separate from the FastAPI
API server (`uvicorn app.main:app`). Start both when developing:

    python run_bot.py          # bot (polling)
    uvicorn app.main:app       # API
"""

import asyncio
import logging

from app.bot.bot_instance import bot, dp
from app.bot.handlers import onboarding, forward_handler, folder_picker, payments
from app.bot.reminders import start_followup_scheduler
from app.database import connect_to_mongo, close_mongo_connection

logging.basicConfig(level=logging.INFO)

dp.include_router(onboarding.router)
dp.include_router(forward_handler.router)
dp.include_router(folder_picker.router)
dp.include_router(payments.router)


async def main():
    await connect_to_mongo()
    try:
        scheduler_task = asyncio.create_task(start_followup_scheduler())
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot)
    finally:
        scheduler_task.cancel()
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
