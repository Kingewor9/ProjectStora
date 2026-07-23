from aiogram import Router, F
from aiogram.types import CallbackQuery

from app.database import get_db
from app.crud import user_crud, file_crud
from app.models.file import FileCreate
from app.config import settings

router = Router(name="folder_picker")


@router.callback_query(F.data.startswith("pick_folder:"))
async def handle_folder_pick(callback: CallbackQuery):
    db = get_db()
    folder_id = callback.data.split(":", 1)[1]

    if folder_id == "new":
        await callback.message.edit_text(
            "Open Stora and create the folder there, then forward the file again — "
            "quick folder creation from chat is coming soon."
        )
        await callback.answer()
        return

    user = await user_crud.refresh_subscription_status(db, callback.from_user.id)
    pending = await file_crud.get_latest_pending_upload(db, callback.from_user.id)

    if not pending:
        await callback.message.edit_text("This upload has expired. Please forward the file again.")
        await callback.answer()
        return

    import asyncio
    from app.crud import folder_crud, sync_crud
    
    target_folder = await folder_crud.get_folder(db, folder_id, callback.from_user.id)
    if target_folder and target_folder.get("is_claimed"):
        await callback.message.edit_text("Cannot add files to a claimed folder. The owner manages its contents.")
        await callback.answer()
        return

    if user.get("plan") == "unlimited":
        updated_user = user
    else:
        if user["credits"] < settings.SAVE_FILE_COST:
            await callback.message.edit_text(
                f"You need {settings.SAVE_FILE_COST} credits to save a file, "
                f"but you only have {user['credits']}. Top up or watch an ad in the app to earn more."
            )
            await callback.answer()
            return

        updated_user = await user_crud.adjust_credits(db, callback.from_user.id, -settings.SAVE_FILE_COST)
        if not updated_user:
            await callback.message.edit_text("Couldn't deduct credits. Please try again.")
            await callback.answer()
            return

    file_create = FileCreate(
        user_id=callback.from_user.id,
        folder_id=folder_id,
        file_name=pending.get("suggested_name") or "Untitled",
        file_type=pending["file_type"],
        telegram_msg_link=pending["telegram_msg_link"],
        telegram_message_id=pending["telegram_message_id"],
    )
    await file_crud.create_file(db, file_create)
    await file_crud.delete_pending_upload(db, pending["_id"])
    
    asyncio.create_task(sync_crud.schedule_sync_notifications(db, callback.from_user.id, folder_id))

    if user.get("plan") == "unlimited":
        await callback.message.edit_text("Saved! Your Stora Unlimited plan covers this save.")
    else:
        await callback.message.edit_text(
            f"Saved! -{settings.SAVE_FILE_COST} credits (balance: {updated_user['credits']})"
        )
    await callback.answer("File saved")
