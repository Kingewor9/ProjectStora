from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.file import FileCreate, FileInDB, PendingUpload


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise ValueError(f"Invalid file id: {id_str}")


async def create_file(db: AsyncIOMotorDatabase, file: FileCreate) -> dict:
    doc = FileInDB(**file.model_dump()).model_dump()
    result = await db.files.insert_one(doc)
    return await db.files.find_one({"_id": result.inserted_id})


async def get_file(db: AsyncIOMotorDatabase, file_id: str, user_id: int) -> Optional[dict]:
    return await db.files.find_one({"_id": _oid(file_id), "user_id": user_id})


async def list_files_in_folder(db: AsyncIOMotorDatabase, folder_id: str, user_id: int) -> list[dict]:
    cursor = db.files.find({"folder_id": folder_id, "user_id": user_id}).sort("created_at", -1)
    return await cursor.to_list(length=None)


async def search_files(db: AsyncIOMotorDatabase, user_id: int, query: str) -> list[dict]:
    cursor = db.files.find(
        {"user_id": user_id, "file_name": {"$regex": query, "$options": "i"}}
    ).sort("created_at", -1)
    return await cursor.to_list(length=None)


async def delete_file(db: AsyncIOMotorDatabase, file_id: str, user_id: int) -> bool:
    result = await db.files.delete_one({"_id": _oid(file_id), "user_id": user_id})
    return result.deleted_count > 0


# --- Pending uploads (forwarded but not yet assigned to a folder) ---

async def create_pending_upload(db: AsyncIOMotorDatabase, pending: PendingUpload) -> dict:
    doc = pending.model_dump()
    result = await db.pending_uploads.insert_one(doc)
    return await db.pending_uploads.find_one({"_id": result.inserted_id})


async def get_latest_pending_upload(db: AsyncIOMotorDatabase, user_id: int) -> Optional[dict]:
    return await db.pending_uploads.find_one(
        {"user_id": user_id}, sort=[("created_at", -1)]
    )


async def delete_pending_upload(db: AsyncIOMotorDatabase, pending_id) -> None:
    await db.pending_uploads.delete_one({"_id": pending_id})
