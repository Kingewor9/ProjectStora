import { useNavigate } from "react-router-dom";

interface CreditsBadgeProps {
  credits: number;
}

export function CreditsBadge({ credits }: CreditsBadgeProps) {
  const navigate = useNavigate();

  return (
    <button className="stora-credits-badge" onClick={() => navigate("/credits")}>
      <span className="stora-credits-dot" aria-hidden="true" />
      {credits} credits
      <style>{`
        .stora-credits-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--tg-card-bg);
          border: none;
          border-radius: var(--stora-radius-pill);
          padding: 8px 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--tg-text-color);
          box-shadow: var(--stora-shadow-card);
          cursor: pointer;
        }
        .stora-credits-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tg-accent-color);
        }
      `}</style>
    </button>
  );
}
