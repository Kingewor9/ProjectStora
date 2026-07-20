import type { Folder } from "@/types/folder.types";

interface FolderCardProps {
  folder: Folder;
  onClick: () => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const details: string[] = [];
  if (folder.subfolder_count > 0) {
    details.push(`${folder.subfolder_count} subfolder${folder.subfolder_count === 1 ? "" : "s"}`);
  }
  details.push(`${folder.file_count} file${folder.file_count === 1 ? "" : "s"}`);

  return (
    <button className="stora-folder-card" onClick={onClick}>
      <div className="stora-folder-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            fill="var(--tg-accent-color)"
            fillOpacity="0.15"
            stroke="var(--tg-accent-color)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="stora-folder-info">
        <span className="stora-folder-name">
          {folder.name}
          {folder.is_shared && <span className="stora-shared-badge">Shared</span>}
        </span>
        <span className="stora-folder-details">{details.join(" · ")}</span>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="var(--tg-hint-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <style>{`
        .stora-folder-card {
          display: flex;
          align-items: center;
          gap: var(--stora-space-3);
          width: 100%;
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: 16px;
          box-shadow: var(--tg-glass-shadow);
          cursor: pointer;
          text-align: left;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
        }
        .stora-folder-card:active {
          transform: scale(0.96);
          box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.1);
        }
        .stora-folder-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--stora-radius-sm);
          background: color-mix(in srgb, var(--tg-accent-color) 12%, transparent);
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(77, 248, 255, 0.1);
        }
        .stora-folder-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stora-folder-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--tg-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }
        .stora-shared-badge {
          flex-shrink: 0;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--tg-accent-color);
          background: color-mix(in srgb, var(--tg-accent-color) 14%, transparent);
          border-radius: var(--stora-radius-pill);
          padding: 2px 8px;
          box-shadow: 0 0 8px rgba(77, 248, 255, 0.2);
        }
        .stora-folder-details {
          font-size: 13px;
          color: var(--tg-hint-color);
        }
      `}</style>
    </button>
  );
}
