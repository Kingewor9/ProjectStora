"""
Model A sharing: A creates a share link for a folder; B "claims" it,
which COPIES the folder tree + files into B's own vault. B never gets
standing access to A's channel — every claimed file is a brand new
File doc, owned by B, backed by a forwarded message in B's own channel.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

ClaimStatus = Literal["in_progress", "completed", "delta"]


class ShareCreate(BaseModel):
    folder_id: str


class ShareInDB(BaseModel):
    token: str
    owner_id: int  # telegram_id of the sharer (A)
    folder_id: str  # A's folder being shared
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ShareOut(BaseModel):
    token: str
    share_link: str  # t.me/<bot>?start=share_<token>
    folder_id: str
    folder_name: str
    revoked: bool
    created_at: datetime


# --- Preview tree (names only — never exposes telegram_msg_link to B) ---

class SharePreviewFile(BaseModel):
    name: str
    file_type: str


class SharePreviewFolder(BaseModel):
    name: str
    files: list[SharePreviewFile]
    subfolders: list["SharePreviewFolder"]


SharePreviewFolder.model_rebuild()


class SharePreview(BaseModel):
    token: str
    owner_name: str
    revoked: bool
    root: SharePreviewFolder
    total_files: int
    total_folders: int  # root + all subfolders
    cost_credits: int
    requester_is_unlimited: bool
    requester_credits: int
    can_afford: bool
    claim_status: Optional[ClaimStatus] = None  # None = not yet claimed by this user
    claimed_root_folder_id: Optional[str] = None


# --- Claim tracking (for resumable, non-atomic bulk copy) ---

class ShareClaimInDB(BaseModel):
    token: str
    owner_id: int
    claimed_by: int
    status: ClaimStatus = "in_progress"
    total_files: int
    total_cost_charged: int
    root_folder_id: Optional[str] = None
    folder_id_map: dict[str, str] = Field(default_factory=dict)  # original folder id -> new folder id (B's)
    copied_file_ids: list[str] = Field(default_factory=list)
    pending_file_ids: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ClaimResult(BaseModel):
    status: ClaimStatus
    root_folder_id: Optional[str]
    copied_count: int
    total_files: int
    total_cost_charged: int
