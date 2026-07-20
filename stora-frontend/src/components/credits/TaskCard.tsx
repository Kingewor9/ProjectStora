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
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: var(--stora-space-4);
          box-shadow: var(--tg-glass-shadow);
          margin-bottom: var(--stora-space-4);
        }
        .stora-task-header {
          display: flex;
          align-items: flex-start;
          gap: var(--stora-space-3);
          margin-bottom: var(--stora-space-4);
        }
        .stora-task-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--stora-radius-md);
          background: color-mix(in srgb, var(--tg-accent-color) 15%, transparent);
          box-shadow: inset 0 0 12px rgba(77, 248, 255, 0.1);
          font-size: 22px;
          flex-shrink: 0;
        }
        .stora-task-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding-top: 2px;
        }
        .stora-task-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--tg-text-color);
        }
        .stora-task-subtitle {
          font-size: 14px;
          color: var(--tg-hint-color);
          line-height: 1.4;
          margin-top: 4px;
        }
        .stora-task-reward {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 16px;
          font-weight: 800;
          color: var(--tg-accent-color);
          flex-shrink: 0;
          white-space: nowrap;
          padding-top: 2px;
        }
        .stora-task-actions {
          display: flex;
          gap: var(--stora-space-3);
        }
        .stora-task-actions > * {
          flex: 1;
        }
      `}</style>
        </div>
    );
}