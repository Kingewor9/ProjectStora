import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/ui/SearchBar";
import { FileList } from "@/components/files/FileList";
import { NewFileModal } from "@/components/files/NewFileModal";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchFilesInFolder, renameFile } from "@/api/files.api";
import { fetchFolderDetail } from "@/api/folders.api";
import type { StoraFile } from "@/types/file.types";

export function FilesPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<StoraFile[]>([]);
  const [folderName, setFolderName] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const botUsername = import.meta.env.VITE_BOT_USERNAME;

  useEffect(() => {
    if (!folderId) return;
    let cancelled = false;
    setIsLoading(true);

    Promise.all([fetchFilesInFolder(folderId), fetchFolderDetail(folderId)])
      .then(([fileData, folderData]) => {
        if (cancelled) return;
        setFiles(fileData);
        setFolderName(folderData.name);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [folderId]);

  const visibleFiles = debouncedSearch
    ? files.filter((f) => f.file_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : files;

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await renameFile(fileId, newName);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, file_name: newName } : f))
      );
    } catch (err) {
      console.error("Failed to rename file:", err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
    }
  };

  return (
    <div className="stora-page">
      <button className="stora-back-btn" onClick={() => navigate(-1)}>
        ‹ Back
      </button>

      <div className="stora-section-header">
        <h1 className="stora-page-title">{folderName || "My Files"}</h1>
        <button className="stora-new-folder-btn" onClick={() => setModalOpen(true)}>
          + New file
        </button>
      </div>

      <div className="stora-files-search">
        <SearchBar value={search} onChange={setSearch} placeholder="Search for files" />
      </div>

      {!isLoading && (
        <FileList 
          files={visibleFiles} 
          onOpenNewFile={() => setModalOpen(true)} 
          onRenameFile={handleRenameFile}
        />
      )}

      <NewFileModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} botUsername={botUsername} />

      <style>{`
        .stora-back-btn {
          background: color-mix(in srgb, var(--tg-card-bg) 60%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-pill);
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 700;
          padding: 8px 16px;
          margin-bottom: var(--stora-space-4);
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .stora-back-btn:hover {
          background: color-mix(in srgb, var(--tg-card-bg) 100%, transparent);
          transform: translateX(-2px);
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
        .stora-files-search {
          margin-bottom: var(--stora-space-5);
        }
      `}</style>
    </div>
  );
}
