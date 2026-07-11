import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="stora-empty">
      {icon && <div className="stora-empty-icon">{icon}</div>}
      <p className="stora-empty-title">{title}</p>
      <p className="stora-empty-message">{message}</p>
      {action}
      <style>{`
        .stora-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--stora-space-6) var(--stora-space-4);
          color: var(--tg-hint-color);
        }
        .stora-empty-icon {
          margin-bottom: var(--stora-space-3);
          opacity: 0.6;
        }
        .stora-empty-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--tg-text-color);
          margin: 0 0 4px;
        }
        .stora-empty-message {
          font-size: 14px;
          margin: 0 0 var(--stora-space-4);
          max-width: 260px;
        }
      `}</style>
    </div>
  );
}
