from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.folder import FolderCreate, FolderInDB


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise ValueError(f"Invalid folder id: {id_str}")


async def create_folder(db: AsyncIOMotorDatabase, user_id: int, folder: FolderCreate) -> dict:
    doc = FolderInDB(
        user_id=user_id, 
        name=folder.name, 
        parent_id=folder.parent_id,
        is_claimed=folder.is_claimed
    ).model_dump()
    result = await db.folders.insert_one(doc)
    return await db.folders.find_one({"_id": result.inserted_id})


async def get_folder(db: AsyncIOMotorDatabase, folder_id: str, user_id: int) -> Optional[dict]:
    return await db.folders.find_one({"_id": _oid(folder_id), "user_id": user_id})


async def list_folders(db: AsyncIOMotorDatabase, user_id: int, parent_id: Optional[str] = None) -> list[dict]:
    """List folders at a given level. parent_id=None means root level."""
    cursor = db.folders.find({"user_id": user_id, "parent_id": parent_id})
    return await cursor.to_list(length=None)


async def list_all_folders_flat(db: AsyncIOMotorDatabase, user_id: int) -> list[dict]:
    """Every folder the user owns, for building the bot's breadcrumb picker."""
    cursor = db.folders.find({"user_id": user_id})
    return await cursor.to_list(length=None)


async def count_files_in_folder(db: AsyncIOMotorDatabase, folder_id: str) -> int:
    return await db.files.count_documents({"folder_id": folder_id})


async def count_subfolders(db: AsyncIOMotorDatabase, folder_id: str) -> int:
    return await db.folders.count_documents({"parent_id": folder_id})


async def get_folder_subtree(db: AsyncIOMotorDatabase, user_id: int, root_folder_id: str) -> list[dict]:
    """
    Returns the root folder plus every descendant folder (BFS over
    parent_id), all owned by user_id. Root is always first in the list.
    Used for recursive operations like sharing or (later) bulk delete.
    """
    root = await get_folder(db, root_folder_id, user_id)
    if not root:
        return []

    all_folders = [root]
    frontier = [str(root["_id"])]

    while frontier:
        cursor = db.folders.find({"user_id": user_id, "parent_id": {"$in": frontier}})
        children = await cursor.to_list(length=None)
        if not children:
            break
        all_folders.extend(children)
        frontier = [str(c["_id"]) for c in children]

    return all_folders


def build_breadcrumb_paths(folders: list[dict]) -> dict[str, str]:
    """
    Given a flat list of folder docs, returns {folder_id: 'Movies > Action'}
    by walking parent chains in memory (avoids N+1 queries).
    """
    by_id = {str(f["_id"]): f for f in folders}
    paths: dict[str, str] = {}

    def resolve(folder_id: str) -> str:
        if folder_id in paths:
            return paths[folder_id]
        f = by_id.get(folder_id)
        if not f:
            return ""
        parent_id = f.get("parent_id")
        if parent_id and parent_id in by_id:
            path = f"{resolve(parent_id)} > {f['name']}"
        else:
            path = f["name"]
        paths[folder_id] = path
        return path

    for fid in by_id:
        resolve(fid)

    return paths
