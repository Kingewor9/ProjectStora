import { useEffect, useState } from "react";
import { Infinity, Share2 } from "lucide-react";
import { CreditsBadge } from "@/components/ui/CreditsBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { FolderList } from "@/components/folders/FolderList";
import { NewFolderModal } from "@/components/folders/NewFolderModal";
import { ShareFolderModal } from "@/components/folders/ShareFolderModal";
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
  const [isShareModalOpen, setShareModalOpen] = useState(false);

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

  const handleOpenUnlimitedPlan = () => {
    navigate("/unlimited");
  };

  return (
    <div className="stora-page">
      <div className="stora-home-header">
        <button className="stora-home-hero" onClick={handleOpenUnlimitedPlan}>
          <span className="stora-home-hero-icon" aria-hidden="true">
            <Infinity size={18} strokeWidth={2.2} />
          </span>
          <span className="stora-home-hero-title">Get Unlimited Credits</span>
        </button>
        <CreditsBadge credits={credits} />
      </div>

      <Breadcrumbs crumbs={breadcrumbs} onNavigate={goToBreadcrumb} onGoRoot={goToRoot} />

      {activeFolder && (
        <button className="stora-view-files-btn" onClick={() => navigate(`/files/${activeFolder.id}`)}>
          <span>📄 View files in "{activeFolder.name}"</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="var(--tg-link-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {activeFolder && (
        <button className="stora-share-folder-btn" onClick={() => setShareModalOpen(true)}>
          <Share2 size={16} strokeWidth={2.2} />
          <span>Share this folder</span>
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

      {activeFolder && (
        <ShareFolderModal
          isOpen={isShareModalOpen}
          onClose={() => setShareModalOpen(false)}
          folderId={activeFolder.id}
          folderName={activeFolder.name}
          onShareStateChange={() => { /* badge updates on next list refresh */ }}
        />
      )}

      <style>{`
        .stora-home-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--stora-space-3);
          margin-bottom: var(--stora-space-5);
        }
        .stora-home-hero {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--tg-button-color) 80%, black), var(--tg-button-color));
          color: #04101E; /* Dark contrast */
          border: 1px solid rgba(77, 248, 255, 0.4);
          border-radius: var(--stora-radius-pill);
          padding: 14px 20px;
          box-shadow: 0 4px 24px rgba(77, 248, 255, 0.3);
          cursor: pointer;
          text-align: center;
          min-height: 54px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-home-hero:hover {
          box-shadow: 0 4px 32px rgba(77, 248, 255, 0.5);
          transform: translateY(-2px);
        }
        .stora-home-hero:active {
          transform: scale(0.97);
        }
        .stora-home-hero:disabled {
          opacity: 0.75;
          cursor: wait;
        }
        .stora-home-hero-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: pulse-glow 3s infinite ease-in-out;
        }
        .stora-home-hero-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }
        .stora-new-folder-btn {
          background: color-mix(in srgb, var(--tg-accent-color) 15%, transparent);
          border: 1px solid rgba(77, 248, 255, 0.2);
          border-radius: var(--stora-radius-pill);
          color: var(--tg-accent-color);
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .stora-new-folder-btn:hover {
          background: color-mix(in srgb, var(--tg-accent-color) 25%, transparent);
        }
        .stora-folders-search {
          margin-bottom: var(--stora-space-5);
        }
        .stora-view-files-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-md);
          padding: 16px 20px;
          box-shadow: var(--tg-glass-shadow);
          color: var(--tg-link-color);
          font-size: 15px;
          font-weight: 700;
          margin-bottom: var(--stora-space-4);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .stora-view-files-btn:active {
          transform: scale(0.98);
        }
        .stora-share-folder-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-md);
          padding: 16px 20px;
          box-shadow: var(--tg-glass-shadow);
          color: var(--tg-text-color);
          font-size: 15px;
          font-weight: 700;
          margin-bottom: var(--stora-space-5);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .stora-share-folder-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
