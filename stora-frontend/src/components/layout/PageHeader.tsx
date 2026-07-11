import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  rightSlot?: ReactNode;
}

export function PageHeader({ title, rightSlot }: PageHeaderProps) {
  return (
    <div className="stora-page-header">
      <h1 className="stora-page-title">{title}</h1>
      {rightSlot}
      <style>{`
        .stora-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--stora-space-4);
        }
        .stora-page-header .stora-page-title {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
