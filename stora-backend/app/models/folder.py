"""
Folder document. Subfolders are modeled via `parent_id` pointing back
to another folder's `_id`. Root-level folders have `parent_id = None`.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None  # None = root-level folder


class FolderInDB(BaseModel):
    user_id: int  # telegram_id
    name: str
    parent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FolderOut(BaseModel):
    id: str
    name: str
    parent_id: Optional[str]
    file_count: int = 0
    subfolder_count: int = 0
    created_at: datetime


class FolderBreadcrumb(BaseModel):
    """Used for the bot's flat folder-picker list, e.g. 'Movies > Action'."""
    id: str
    path: str  # full breadcrumb string
