"""
Central app configuration. Loads everything from .env once, so the rest
of the codebase just does `from app.config import settings`.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Telegram ---
    BOT_TOKEN: str
    BOT_USERNAME: str = "StoraBot"
    USER_INFO_BOT_USERNAME: str = "userinfobot"
    ADMIN_TELEGRAM_ID: int | None = None

    # --- MongoDB ---
    MONGO_URI: str
    MONGO_DB_NAME: str = "stora_db"

    # --- App ---
    API_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    WEBHOOK_URL: str | None = None
    SECRET_KEY: str

    # --- Credits economics ---
    STARTING_CREDITS: int = 10
    SAVE_FILE_COST: int = 2
    DAILY_BONUS_CREDITS: int = 5
    INVITE_BONUS_CREDITS: int = 15
    SUBSCRIBE_BONUS_CREDITS: int = 5
    STARS_TO_CREDITS_RATE: int = 5  # 1 credit = N telegram stars
    UNLIMITED_PLAN_STARS_COST: int = 150
    UNLIMITED_PLAN_DURATION_DAYS: int = 30

    # --- Ads ---
    ADSGRAM_BLOCK_ID: str | None = None

    # --- Official channel ---
    OFFICIAL_CHANNEL_USERNAME: str = "StoraOfficial"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
