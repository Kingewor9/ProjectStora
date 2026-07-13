import type { ReactNode } from "react";

interface TaskCardProps {
    icon: ReactNode;
    iconBg?: string;
    title: string;
    subtitle: string;
    reward: number;
    children: ReactNode; // action button(s) and any extra content (link box, input)
}

export function TaskCard({ icon, iconBg, title, subtitle, reward, children }: TaskCardProps) {
    return (
        <div className="stora-task-card">
            <div className="stora-task-header">
                <div className="stora-task-icon" style={iconBg ? { background: iconBg } : undefined}>
                    {icon}
                </div>
                <div className="stora-task-copy">
                    <span className="stora-task-title">{title}</span>
                    <span className="stora-task-subtitle">{subtitle}</span>
                </div>
                <div className="stora-task-reward">
                    +{reward} <span aria-hidden="true">✨</span>
                </div>
            </div>
            <div className="stora-task-actions">{children}</div>
            <style>{`
        .stora-task-card {
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
          margin-bottom: var(--stora-space-3);
        }
        .stora-task-header {
          display: flex;
          align-items: flex-start;
          gap: var(--stora-space-3);
          margin-bottom: var(--stora-space-3);
        }
        .stora-task-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--stora-radius-sm);
          background: color-mix(in srgb, var(--tg-accent-color) 12%, transparent);
          font-size: 20px;
          flex-shrink: 0;
        }
        .stora-task-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stora-task-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--tg-text-color);
        }
        .stora-task-subtitle {
          font-size: 13px;
          color: var(--tg-hint-color);
          line-height: 1.4;
          margin-top: 2px;
        }
        .stora-task-reward {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 15px;
          font-weight: 700;
          color: var(--tg-text-color);
          flex-shrink: 0;
          white-space: nowrap;
        }
        .stora-task-actions {
          display: flex;
          gap: var(--stora-space-2);
        }
        .stora-task-actions > * {
          flex: 1;
        }
      `}</style>
        </div>
    );
}