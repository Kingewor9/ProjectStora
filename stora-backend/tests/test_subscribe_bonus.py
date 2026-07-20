import asyncio

from app.routers import credits


class DummyMember:
    def __init__(self, status):
        self.status = status


class DummyBot:
    def __init__(self, status, allowed_chat_ids=None):
        self.status = status
        self.allowed_chat_ids = set(allowed_chat_ids or [])
        self.calls = []

    async def get_chat_member(self, chat_id, user_id):
        self.calls.append((chat_id, user_id))
        if self.allowed_chat_ids and chat_id not in self.allowed_chat_ids:
            raise ValueError("Unsupported chat id")
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


def test_subscribe_membership_check_accepts_at_prefixed_usernames():
    bot = DummyBot("member", allowed_chat_ids={"@StoraOfficial"})

    result = asyncio.run(credits.is_user_subscribed_to_channel(bot, 123, "StoraOfficial"))

    assert result is True
    assert bot.calls == [("StoraOfficial", 123), ("@StoraOfficial", 123)]


def test_subscribe_membership_check_accepts_separator_variants():
    bot = DummyBot("member", allowed_chat_ids={"Storaofficial"})

    result = asyncio.run(credits.is_user_subscribed_to_channel(bot, 123, "Stora_official"))

    assert result is True
    assert bot.calls[0] == ("Stora_official", 123)
    assert bot.calls[1] == ("@Stora_official", 123)
    assert bot.calls[2] == ("Storaofficial", 123)
