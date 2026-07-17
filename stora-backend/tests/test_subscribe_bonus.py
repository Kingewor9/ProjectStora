import asyncio

from app.routers import credits


class DummyMember:
    def __init__(self, status):
        self.status = status


class DummyBot:
    def __init__(self, status):
        self.status = status
        self.calls = []

    async def get_chat_member(self, chat_id, user_id):
        self.calls.append((chat_id, user_id))
        return DummyMember(self.status)


def test_subscribe_membership_check_accepts_joined_users():
    bot = DummyBot("member")

    result = asyncio.run(credits.is_user_subscribed_to_channel(bot, 123, "StoraOfficial"))

    assert result is True
    assert bot.calls == [("StoraOfficial", 123)]


def test_subscribe_membership_check_rejects_non_members():
    bot = DummyBot("left")

    result = asyncio.run(credits.is_user_subscribed_to_channel(bot, 123, "StoraOfficial"))

    assert result is False
