import asyncio
from datetime import datetime, timedelta

from app.crud import user_crud


class DummyUsersCollection:
    def __init__(self, user_docs):
        self.user_docs = user_docs

    async def find_one(self, query):
        for doc in self.user_docs:
            if query.get("telegram_id") == doc.get("telegram_id"):
                return doc
        return None

    async def update_one(self, query, update):
        for doc in self.user_docs:
            if query.get("telegram_id") == doc.get("telegram_id"):
                for key, value in update.get("$set", {}).items():
                    doc[key] = value
                return

    async def find(self, query):
        def matches(doc):
            if "$or" in query:
                return any(
                    _matches_clause(doc, clause)
                    for clause in query["$or"]
                ) and _matches_clause(doc, {k: v for k, v in query.items() if k != "$or"})
            return _matches_clause(doc, query)

        def _matches_clause(doc, clause):
            for key, value in clause.items():
                if key == "$or":
                    continue
                if key == "is_onboarded":
                    if doc.get(key) != value:
                        return False
                    continue
                if isinstance(value, dict):
                    if not _matches_operator(doc.get(key), value):
                        return False
                    continue
                if doc.get(key) != value:
                    return False
            return True

        def _matches_operator(value, operator):
            for op, expected in operator.items():
                if op == "$lte" and not (value is not None and value <= expected):
                    return False
                if op == "$gte" and not (value is not None and value >= expected):
                    return False
                if op == "$eq" and value != expected:
                    return False
            return True

        results = []
        for doc in self.user_docs:
            if matches(doc):
                results.append(doc)
        return results


class DummyDB:
    def __init__(self, user_docs):
        self.users = DummyUsersCollection(user_docs)


def test_mark_onboarding_started_sets_timestamp_once():
    user_doc = {"telegram_id": 101}
    db = DummyDB([user_doc])

    updated_once = asyncio.run(user_crud.mark_onboarding_started(db, 101))
    updated_twice = asyncio.run(user_crud.mark_onboarding_started(db, 101))

    assert updated_once["onboarding_started_at"] is not None
    assert updated_twice["onboarding_started_at"] == updated_once["onboarding_started_at"]


def test_get_due_onboarding_followups_returns_users_after_delay():
    now = datetime.utcnow()
    due_user = {
        "telegram_id": 201,
        "is_onboarded": False,
        "onboarding_started_at": now - timedelta(hours=2, minutes=5),
        "onboarding_followup_sent_at": None,
    }
    repeat_user = {
        "telegram_id": 202,
        "is_onboarded": False,
        "onboarding_started_at": now - timedelta(days=3),
        "onboarding_followup_sent_at": now - timedelta(days=2, hours=1),
    }
    not_due_user = {
        "telegram_id": 203,
        "is_onboarded": False,
        "onboarding_started_at": now - timedelta(hours=1),
        "onboarding_followup_sent_at": None,
    }
    onboarded_user = {
        "telegram_id": 204,
        "is_onboarded": True,
        "onboarding_started_at": now - timedelta(days=1),
        "onboarding_followup_sent_at": None,
    }

    db = DummyDB([due_user, repeat_user, not_due_user, onboarded_user])

    due_users = asyncio.run(user_crud.get_due_onboarding_followups(db, now))

    assert [user["telegram_id"] for user in due_users] == [201, 202]
