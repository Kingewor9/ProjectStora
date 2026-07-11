import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/ui/SearchBar";
import { FileList } from "@/components/files/FileList";
import { NewFileModal } from "@/components/files/NewFileModal";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchFilesInFolder } from "@/api/files.api";
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

      {!isLoading && <FileList files={visibleFiles} onOpenNewFile={() => setModalOpen(true)} />}

      <NewFileModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} botUsername={botUsername} />

      <style>{`
        .stora-back-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 15px;
          font-weight: 500;
          padding: 0;
          margin-bottom: var(--stora-space-2);
          cursor: pointer;
        }
        .stora-new-folder-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .stora-files-search {
          margin-bottom: var(--stora-space-4);
        }
      `}</style>
    </div>
  );
}
