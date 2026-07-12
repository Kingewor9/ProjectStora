from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.telegram_auth import get_current_telegram_user
from app.models.file import FileOut
from app.crud import file_crud
from app.bot.bot_instance import bot

router = APIRouter(prefix="/api/files", tags=["files"])


class FileRename(BaseModel):
    file_name: str


def _to_file_out(doc: dict) -> FileOut:
    return FileOut(
        id=str(doc["_id"]),
        folder_id=doc["folder_id"],
        file_name=doc["file_name"],
        file_type=doc["file_type"],
        telegram_msg_link=doc["telegram_msg_link"],
        file_size=doc.get("file_size"),
        created_at=doc["created_at"],
    )


@router.get("/folder/{folder_id}", response_model=list[FileOut])
async def get_files_in_folder(
    folder_id: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    files = await file_crud.list_files_in_folder(db, folder_id, tg_user["id"])
    return [_to_file_out(f) for f in files]


@router.get("/search", response_model=list[FileOut])
async def search_user_files(
    q: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    files = await file_crud.search_files(db, tg_user["id"], q)
    return [_to_file_out(f) for f in files]


@router.post("/{file_id}/send")
async def send_file_to_chat(
    file_id: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Forwards the stored file from the user's private channel back into
    their DM with the bot ("Send" button on the Files page).
    """
    file_doc = await file_crud.get_file(db, file_id, tg_user["id"])
    if not file_doc:
        raise HTTPException(404, "File not found")

    user_doc = await db.users.find_one({"telegram_id": tg_user["id"]})
    if not user_doc or not user_doc.get("private_channel_id"):
        raise HTTPException(400, "No linked channel found")

    await bot.forward_message(
        chat_id=tg_user["id"],
        from_chat_id=user_doc["private_channel_id"],
        message_id=file_doc["telegram_message_id"],
    )
    return {"status": "sent"}


@router.delete("/{file_id}")
async def delete_user_file(
    file_id: str,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    deleted = await file_crud.delete_file(db, file_id, tg_user["id"])
    if not deleted:
        raise HTTPException(404, "File not found")
    return {"status": "deleted"}


@router.patch("/{file_id}/rename")
async def rename_user_file(
    file_id: str,
    payload: FileRename,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    updated = await file_crud.rename_file(db, file_id, tg_user["id"], payload.file_name)
    if not updated:
        raise HTTPException(404, "File not found")
    return {"status": "renamed", "file_name": payload.file_name}
