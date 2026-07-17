from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from app.config import settings


def open_app_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Open Stora", web_app=WebAppInfo(url=settings.FRONTEND_URL))]
        ]
    )


def open_shared_folder_keyboard(token: str) -> InlineKeyboardMarkup:
    """Sends an already-onboarded user straight into the SharedFolderPage
    via the hash route — no backend round-trip needed for this case."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="View shared folder",
                web_app=WebAppInfo(url=f"{settings.FRONTEND_URL}/#/shared/{token}"),
            )]
        ]
    )


def folder_picker_keyboard(folders_with_paths: list[dict]) -> InlineKeyboardMarkup:
    """
    folders_with_paths: [{"id": "...", "path": "Movies > Action"}, ...]
    Flat list with breadcrumb paths, per the agreed folder-picker UX.
    One folder per row so long breadcrumb paths stay readable.
    """
    rows = [
        [InlineKeyboardButton(text=f["path"], callback_data=f"pick_folder:{f['id']}")]
        for f in folders_with_paths
    ]
    rows.append([InlineKeyboardButton(text="+ New Folder", callback_data="pick_folder:new")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def confirm_new_folder_name_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Cancel", callback_data="cancel_new_folder")]]
    )
