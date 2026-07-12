import { useState } from "react";
import type { StoraFile } from "@/types/file.types";
import { FileCard } from "./FileCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { sendFileToChat } from "@/api/files.api";

interface FileListProps {
  files: StoraFile[];
  onOpenNewFile: () => void;
  onRenameFile?: (fileId: string, newName: string) => Promise<void>;
}

export function FileList({ files, onOpenNewFile, onRenameFile }: FileListProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSend = async (file: StoraFile) => {
    setSendingId(file.id);
    try {
      await sendFileToChat(file.id);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    } catch (err) {
      console.error("Failed to send file:", err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
    } finally {
      setSendingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <EmptyState
        title="No files yet"
        message="Forward a photo, video, document, or text to the bot to save it here."
        action={
          <button className="stora-empty-cta" onClick={onOpenNewFile}>
            + New file
          </button>
        }
      />
    );
  }

  return (
    <div className="stora-file-list">
      {files.map((file) => (
        <FileCard 
          key={file.id} 
          file={file} 
          onSend={handleSend} 
          onRename={onRenameFile}
          isSending={sendingId === file.id} 
        />
      ))}
      <style>{`
        .stora-file-list {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-2);
        }
        .stora-empty-cta {
          background: var(--tg-button-color);
          color: var(--tg-button-text-color);
          border: none;
          border-radius: var(--stora-radius-pill);
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
