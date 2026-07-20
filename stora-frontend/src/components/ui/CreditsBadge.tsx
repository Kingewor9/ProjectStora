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
          gap: 8px;
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-pill);
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          color: var(--tg-text-color);
          box-shadow: var(--tg-glass-shadow);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
        }
        .stora-credits-badge:active {
          transform: scale(0.95);
        }
        .stora-credits-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tg-accent-color);
          box-shadow: 0 0 10px var(--tg-accent-color);
          animation: glow-pulse 2s infinite ease-in-out;
        }
      `}</style>
    </button>
  );
}
