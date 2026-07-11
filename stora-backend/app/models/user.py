"""
User document shape. `_id` in Mongo is the Mongo ObjectId, but we key
lookups by `telegram_id` since that's what the bot/mini app actually knows.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    photo_url: Optional[str] = None
    language: str = "en"
    timezone: Optional[str] = None


class UserCreate(UserBase):
    """Used when first creating a user (before onboarding is complete)."""
    pass


class UserInDB(UserBase):
    private_channel_id: Optional[str] = None
    is_onboarded: bool = False
    credits: int = 10
    last_daily_claim: Optional[datetime] = None
    referred_by: Optional[int] = None  # telegram_id of inviter
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserOut(BaseModel):
    """What we actually send back to the frontend."""
    telegram_id: int
    username: Optional[str]
    first_name: Optional[str]
    photo_url: Optional[str]
    language: str
    timezone: Optional[str]
    is_onboarded: bool
    credits: int


class OnboardingRequest(BaseModel):
    channel_id: str  # e.g. "-1001234567890", pasted by user via User Info bot
