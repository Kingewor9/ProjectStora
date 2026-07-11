import type { Folder } from "@/types/folder.types";
import { FolderCard } from "./FolderCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface FolderListProps {
  folders: Folder[];
  onOpenFolder: (folder: Folder) => void;
  isRoot: boolean;
}

export function FolderList({ folders, onOpenFolder, isRoot }: FolderListProps) {
  if (folders.length === 0) {
    return (
      <EmptyState
        title={isRoot ? "No folders yet" : "No subfolders yet"}
        message={
          isRoot
            ? "Create your first folder to start organizing what you store in Stora."
            : "Tap the plus icon to create a subfolder here."
        }
      />
    );
  }

  return (
    <div className="stora-folder-list">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} onClick={() => onOpenFolder(folder)} />
      ))}
      <style>{`
        .stora-folder-list {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-2);
        }
      `}</style>
    </div>
  );
}
