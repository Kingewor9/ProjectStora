"""
Single Motor client shared across the whole app. Import `db` anywhere
you need a collection: db.users, db.folders, db.files
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings


class Database:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


database = Database()


async def connect_to_mongo():
    database.client = AsyncIOMotorClient(settings.MONGO_URI)
    database.db = database.client[settings.MONGO_DB_NAME]

    # Indexes — created once, safe to call repeatedly (no-op if they exist)
    await database.db.users.create_index("telegram_id", unique=True)
    await database.db.folders.create_index([("user_id", 1), ("parent_id", 1)])
    await database.db.files.create_index([("user_id", 1), ("folder_id", 1)])
    await database.db.files.create_index([("user_id", 1), ("file_name", "text")])
    await database.db.shares.create_index("token", unique=True)
    await database.db.shares.create_index([("owner_id", 1), ("folder_id", 1)])
    await database.db.share_claims.create_index([("token", 1), ("claimed_by", 1)], unique=True)


async def close_mongo_connection():
    if database.client:
        database.client.close()


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency-style accessor."""
    return database.db
