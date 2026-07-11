import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreditsBadge } from "@/components/ui/CreditsBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { FolderList } from "@/components/folders/FolderList";
import { NewFolderModal } from "@/components/folders/NewFolderModal";
import { Breadcrumbs } from "@/components/folders/Breadcrumbs";
import { useFolderStore } from "@/store/folderStore";
import { useUserStore } from "@/store/userStore";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchFolders, createFolder } from "@/api/folders.api";
import type { Folder } from "@/types/folder.types";
import { useNavigate } from "react-router-dom";

export function FoldersPage() {
  const navigate = useNavigate();
  const credits = useUserStore((s) => s.user?.credits ?? 0);
  const { currentFolderId, breadcrumbs, folders, setFolders, enterFolder, goToBreadcrumb, goToRoot } =
    useFolderStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchFolders(currentFolderId)
      .then((data) => {
        if (!cancelled) setFolders(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentFolderId]);

  const visibleFolders = debouncedSearch
    ? folders.filter((f) => f.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : folders;

  const handleOpenFolder = (folder: Folder) => {
    // Tapping a folder drills into ITS subfolders, in place — Files live
    // on their own dedicated page, reached via the "View files" entry point.
    enterFolder(folder);
  };

  const handleCreateFolder = async (name: string) => {
    const created = await createFolder({ name, parent_id: currentFolderId });
    setFolders([...folders, created]);
  };

  const activeFolder = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1] : null;

  return (
    <div className="stora-page">
      <PageHeader title="Stora" rightSlot={<CreditsBadge credits={credits} />} />

      <Breadcrumbs crumbs={breadcrumbs} onNavigate={goToBreadcrumb} onGoRoot={goToRoot} />

      {activeFolder && (
        <button className="stora-view-files-btn" onClick={() => navigate(`/files/${activeFolder.id}`)}>
          <span>📄 View files in "{activeFolder.name}"</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="var(--tg-link-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <div className="stora-section-header">
        <h2 className="stora-section-title">{activeFolder ? "Subfolders" : "My Folders"}</h2>
        <button className="stora-new-folder-btn" onClick={() => setModalOpen(true)}>
          + New folder
        </button>
      </div>

      <div className="stora-folders-search">
        <SearchBar value={search} onChange={setSearch} placeholder="Search for folders" />
      </div>

      {!isLoading && (
        <FolderList folders={visibleFolders} onOpenFolder={handleOpenFolder} isRoot={!currentFolderId} />
      )}

      <NewFolderModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateFolder} />

      <style>{`
        .stora-new-folder-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .stora-folders-search {
          margin-bottom: var(--stora-space-4);
        }
        .stora-view-files-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: var(--tg-card-bg);
          border: none;
          border-radius: var(--stora-radius-md);
          padding: 14px;
          box-shadow: var(--stora-shadow-card);
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: var(--stora-space-4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
