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
  isSending: boolean;
}

export function FileCard({ file, onSend, isSending }: FileCardProps) {
  return (
    <div className="stora-file-card">
      <div className="stora-file-icon" aria-hidden="true">
        {TYPE_ICONS[file.file_type]}
      </div>
      <div className="stora-file-info">
        <span className="stora-file-name">{file.file_name}</span>
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
          border-radius: var(--stora-radius-md);
          padding: 14px;
          box-shadow: var(--stora-shadow-card);
        }
        .stora-file-icon {
          font-size: 20px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--stora-radius-sm);
          background: var(--tg-secondary-bg-color);
          flex-shrink: 0;
        }
        .stora-file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stora-file-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--tg-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stora-file-meta {
          font-size: 13px;
          color: var(--tg-hint-color);
          text-transform: capitalize;
        }
        .stora-file-send {
          background: color-mix(in srgb, var(--tg-accent-color) 12%, transparent);
          color: var(--tg-accent-color);
          border: none;
          border-radius: var(--stora-radius-pill);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
        }
        .stora-file-send:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
