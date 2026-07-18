"""
Validates Telegram Mini App `initData` per Telegram's official spec:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

The frontend sends the raw initData string in an Authorization header
on every request; this checks the HMAC signature against BOT_TOKEN.
"""

import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException, status

from app.config import settings


def _compute_hash(data_check_string: str) -> str:
    secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
    return hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()


def validate_init_data(init_data: str) -> dict:
    """Returns the parsed `user` dict if valid, raises otherwise."""
    parsed = dict(parse_qsl(init_data, strict_parsing=True))
    received_hash = parsed.pop("hash", None)

    if not received_hash:
        raise ValueError("Missing hash in initData")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    computed_hash = _compute_hash(data_check_string)

    if not hmac.compare_digest(computed_hash, received_hash):
        raise ValueError("Invalid initData signature")

    user_raw = parsed.get("user")
    if not user_raw:
        raise ValueError("Missing user in initData")

    return json.loads(user_raw)


async def get_current_telegram_user(authorization: str = Header(...)) -> dict:
    """
    FastAPI dependency. Expects header: Authorization: tma <init_data_string>
    """
    if not authorization.startswith("tma "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Authorization scheme")

    init_data = authorization[4:]
    try:
        return validate_init_data(init_data)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))


async def require_admin(tg_user: dict = Depends(get_current_telegram_user)) -> dict:
    """
    Guards admin-only endpoints. Never trust the frontend hiding the UI —
    this is the actual enforcement, checked against the validated initData
    identity, not anything the client claims about itself.
    """
    if not settings.ADMIN_TELEGRAM_ID or tg_user["id"] != settings.ADMIN_TELEGRAM_ID:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access only")
    return tg_user
