import { useState } from "react";
import type { StoraFile } from "@/types/file.types";

const TYPE_ICONS: Record<StoraFile["file_type"], string> = {
  photo: "🖼️",
  video: "🎞️",
  document: "📄",
  audio: "🎵",
  text: "📝",
};

interface FileCardProps {
  file: StoraFile;
  onSend: (file: StoraFile) => void;
  onRename?: (fileId: string, newName: string) => Promise<void>;
  isSending: boolean;
}

export function FileCard({ file, onSend, onRename, isSending }: FileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.file_name);

  const handleRename = async () => {
    if (editName.trim() && editName !== file.file_name && onRename) {
      await onRename(file.id, editName.trim());
    } else {
      setEditName(file.file_name); // reset if no change
    }
    setIsEditing(false);
  };

  return (
    <div className="stora-file-card">
      <div className="stora-file-icon" aria-hidden="true">
        {TYPE_ICONS[file.file_type]}
      </div>
      <div className="stora-file-info">
        {isEditing ? (
          <input
            type="text"
            className="stora-file-edit-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
        ) : (
          <div className="stora-file-name-row">
            <span className="stora-file-name">{file.file_name}</span>
            {onRename && (
              <button 
                className="stora-file-edit-btn" 
                onClick={() => setIsEditing(true)}
                aria-label="Rename file"
              >
                ✏️
              </button>
            )}
          </div>
        )}
        <span className="stora-file-meta">{file.file_type}</span>
      </div>
      <button
        className="stora-file-send"
        onClick={() => onSend(file)}
        disabled={isSending}
        aria-label={`Send ${file.file_name} to chat`}
      >
        {isSending ? "..." : "Send"}
      </button>
      <style>{`
        .stora-file-card {
          display: flex;
          align-items: center;
          gap: var(--stora-space-3);
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: 16px;
          box-shadow: var(--tg-glass-shadow);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-file-card:hover {
          transform: translateY(-2px);
        }
        .stora-file-icon {
          font-size: 20px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--stora-radius-sm);
          background: var(--tg-secondary-bg-color);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }
        .stora-file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stora-file-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--tg-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stora-file-meta {
          font-size: 13px;
          color: var(--tg-hint-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .stora-file-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }
        .stora-file-edit-btn {
          background: none;
          border: none;
          padding: 4px;
          font-size: 13px;
          cursor: pointer;
          opacity: 0.3;
          transition: opacity 0.2s;
        }
        .stora-file-edit-btn:hover {
          opacity: 1;
        }
        .stora-file-edit-input {
          font-size: 16px;
          font-weight: 600;
          color: var(--tg-accent-color);
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--tg-accent-color);
          border-radius: var(--stora-radius-sm);
          padding: 4px 8px;
          width: 100%;
          outline: none;
          margin-bottom: 4px;
        }
        .stora-file-send {
          background: color-mix(in srgb, var(--tg-accent-color) 12%, transparent);
          color: var(--tg-accent-color);
          border: 1px solid rgba(77, 248, 255, 0.1);
          border-radius: var(--stora-radius-pill);
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .stora-file-send:hover:not(:disabled) {
          background: color-mix(in srgb, var(--tg-accent-color) 20%, transparent);
          box-shadow: 0 0 12px rgba(77, 248, 255, 0.2);
        }
        .stora-file-send:disabled {
          opacity: 0.5;
          cursor: wait;
        }
      `}</style>
    </div>
  );
}
