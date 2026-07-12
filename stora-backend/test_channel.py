import asyncio
from app.bot.bot_instance import bot

async def main():
    try:
        # Just passing a dummy string to see the Exception type
        res = await bot.get_chat_member(chat_id="-1001234567890", user_id=bot.id)
        print("Success:", res)
    except Exception as e:
        print("Exception:", type(e), str(e))

if __name__ == "__main__":
    asyncio.run(main())
