from aiogram import Router, F
from aiogram.types import Message

from app.database import get_db
from app.crud import user_crud, folder_crud, file_crud
from app.models.file import PendingUpload, FileType
from app.bot.keyboards import folder_picker_keyboard

router = Router(name="forward_handler")


def _detect_file_type(message: Message) -> FileType:
    if message.photo:
        return "photo"
    if message.video:
        return "video"
    if message.audio or message.voice:
        return "audio"
    if message.document:
        return "document"
    return "text"


def _suggested_name(message: Message, file_type: FileType) -> str:
    if message.caption:
        return message.caption[:60]
    if file_type == "document" and message.document:
        return message.document.file_name or "Untitled document"
    return f"{file_type.capitalize()} - {message.date.strftime('%d %b %Y')}"


@router.message(F.photo | F.video | F.document | F.audio | F.voice | (F.text & ~F.text.startswith("/")))
async def handle_incoming_content(message: Message):
    """
    Zero-friction save: anything the user sends/forwards directly to the
    bot gets pushed into their private channel, then they're asked which
    folder to file it under.
    """
    db = get_db()
    user = await user_crud.get_user(db, message.from_user.id)

    if not user or not user.get("is_onboarded"):
        await message.answer("You need to finish setup first! Send /start to begin.")
        return

    # Push the content into the user's private channel (the actual "storage")
    forwarded = await message.forward(chat_id=user["private_channel_id"])

    file_type = _detect_file_type(message)
    suggested_name = _suggested_name(message, file_type)

    pending = PendingUpload(
        user_id=message.from_user.id,
        telegram_msg_link=f"https://t.me/c/{str(user['private_channel_id']).replace('-100', '')}/{forwarded.message_id}",
        telegram_message_id=forwarded.message_id,
        file_type=file_type,
        suggested_name=suggested_name,
    )
    await file_crud.create_pending_upload(db, pending)

    all_folders = await folder_crud.list_all_folders_flat(db, message.from_user.id)
    if not all_folders:
        await message.answer(
            "Saved to your vault! You don't have any folders yet — "
            "open Stora and create one, then come back to file this in."
        )
        return

    paths = folder_crud.build_breadcrumb_paths(all_folders)
    folders_with_paths = [{"id": str(f["_id"]), "path": paths[str(f["_id"])]} for f in all_folders]

    await message.answer(
        f"Got it! Saved as \"{suggested_name}\".\nWhich folder should this go in?",
        reply_markup=folder_picker_keyboard(folders_with_paths),
    )
