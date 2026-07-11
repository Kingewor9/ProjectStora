from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

FileType = Literal["photo", "video", "document", "audio", "text"]


class FileCreate(BaseModel):
    user_id: int
    folder_id: str
    file_name: str
    file_type: FileType
    telegram_msg_link: str  # https://t.me/c/<channel>/<msg_id>
    telegram_message_id: int
    file_size: Optional[int] = None


class FileInDB(FileCreate):
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FileOut(BaseModel):
    id: str
    folder_id: str
    file_name: str
    file_type: FileType
    telegram_msg_link: str
    file_size: Optional[int]
    created_at: datetime


class PendingUpload(BaseModel):
    """
    Temporary record created the moment a user forwards something to the
    bot, before they've picked a folder. Cleared once folder is chosen.
    """
    user_id: int
    telegram_msg_link: str
    telegram_message_id: int
    file_type: FileType
    suggested_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
