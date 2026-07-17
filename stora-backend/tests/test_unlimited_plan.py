import asyncio
from datetime import datetime, timedelta

from app.crud import user_crud


class DummyUsersCollection:
    def __init__(self, user_doc):
        self.user_doc = user_doc
        self.updated = None

    async def find_one(self, query):
        if query.get("telegram_id") == self.user_doc.get("telegram_id"):
            return self.user_doc
        return None

    async def update_one(self, query, update):
        self.updated = (query, update)
        self.user_doc.update(update.get("$set", {}))


class DummyDB:
    def __init__(self, user_doc):
        self.users = DummyUsersCollection(user_doc)


def test_refresh_subscription_status_returns_free_when_plan_expired():
    user_doc = {
        "telegram_id": 101,
        "plan": "unlimited",
        "subscription_expires_at": datetime.utcnow() - timedelta(days=1),
    }
    db = DummyDB(user_doc)

    updated_user = asyncio.run(user_crud.refresh_subscription_status(db, 101))

    assert updated_user is not None
    assert updated_user["plan"] == "free"
    assert updated_user["subscription_expires_at"] is None
