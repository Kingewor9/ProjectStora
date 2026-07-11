interface BreadcrumbEntry {
  id: string;
  name: string;
}

interface BreadcrumbsProps {
  crumbs: BreadcrumbEntry[];
  onNavigate: (index: number) => void;
  onGoRoot: () => void;
}

export function Breadcrumbs({ crumbs, onNavigate, onGoRoot }: BreadcrumbsProps) {
  if (crumbs.length === 0) return null;

  return (
    <div className="stora-breadcrumbs">
      <button onClick={onGoRoot}>Folders</button>
      {crumbs.map((crumb, index) => (
        <span key={crumb.id}>
          <span className="stora-breadcrumb-sep">›</span>
          <button
            onClick={() => onNavigate(index)}
            className={index === crumbs.length - 1 ? "current" : ""}
          >
            {crumb.name}
          </button>
        </span>
      ))}
      <style>{`
        .stora-breadcrumbs {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: var(--stora-space-3);
          font-size: 13px;
        }
        .stora-breadcrumbs button {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 13px;
          font-weight: 500;
          padding: 2px 0;
          cursor: pointer;
        }
        .stora-breadcrumbs button.current {
          color: var(--tg-hint-color);
          font-weight: 600;
        }
        .stora-breadcrumb-sep {
          color: var(--tg-hint-color);
          margin: 0 2px;
        }
      `}</style>
    </div>
  );
}
