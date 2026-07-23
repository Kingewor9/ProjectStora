from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.models.folder import FolderCreate, FolderOut
from app.crud import folder_crud, share_crud

router = APIRouter(prefix="/api/folders", tags=["folders"])


def _to_folder_out(doc: dict, file_count: int, subfolder_count: int, is_shared: bool = False) -> FolderOut:
    return FolderOut(
        id=str(doc["_id"]),
        name=doc["name"],
        parent_id=doc.get("parent_id"),
        file_count=file_count,
        subfolder_count=subfolder_count,
        is_shared=is_shared,
        is_claimed=doc.get("is_claimed", False),
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[FolderOut])
async def get_folders(
    parent_id: Optional[str] = None,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List folders at a given level. Omit parent_id for root."""
    folders = await folder_crud.list_folders(db, tg_user["id"], parent_id)
    folder_ids = [str(f["_id"]) for f in folders]
    shared_ids = await share_crud.get_shared_folder_ids(db, tg_user["id"], folder_ids)

    out = []
    for f in folders:
        fid = str(f["_id"])
        file_count = await folder_crud.count_files_in_folder(db, fid)
        subfolder_count = await folder_crud.count_subfolders(db, fid)
        out.append(_to_folder_out(f, file_count, subfolder_count, is_shared=fid in shared_ids))
    return out


@router.post("", response_model=FolderOut)
async def create_new_folder(
    payload: FolderCreate,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if payload.parent_id:
        parent = await folder_crud.get_folder(db, payload.parent_id, tg_user["id"])
        if not parent:
            raise HTTPException(404, "Parent folder not found")
        if parent.get("is_claimed"):
            raise HTTPException(403, "Cannot add subfolders to a claimed folder")

    doc = await folder_crud.create_folder(db, tg_user["id"], payload)
    return _to_folder_out(doc, file_count=0, subfolder_count=0)


@router.get("/{folder_id}", response_model=FolderOut)
async def get_folder_detail(
    folder_id: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await folder_crud.get_folder(db, folder_id, tg_user["id"])
    if not doc:
        raise HTTPException(404, "Folder not found")
    file_count = await folder_crud.count_files_in_folder(db, folder_id)
    subfolder_count = await folder_crud.count_subfolders(db, folder_id)
    shared_ids = await share_crud.get_shared_folder_ids(db, tg_user["id"], [folder_id])
    return _to_folder_out(doc, file_count, subfolder_count, is_shared=folder_id in shared_ids)
