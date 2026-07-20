import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { BalanceCard } from "@/components/credits/BalanceCard";
import { TopUpSection } from "@/components/credits/TopUpSection";
import { EarnTaskList } from "@/components/credits/EarnTaskList";

export function CreditsPage() {
  const navigate = useNavigate();
  const credits = useUserStore((s) => s.user?.credits ?? 0);

  return (
    <div className="stora-page">
      <button className="stora-back-btn" onClick={() => navigate(-1)}>
        ‹ Back
      </button>
      <h1 className="stora-page-title">Stora Credits</h1>

      <BalanceCard balance={credits} />
      <TopUpSection />
      <EarnTaskList />

      <style>{`
        .stora-back-btn {
          background: color-mix(in srgb, var(--tg-card-bg) 60%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-pill);
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 700;
          padding: 8px 16px;
          margin-bottom: var(--stora-space-4);
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .stora-back-btn:hover {
          background: color-mix(in srgb, var(--tg-card-bg) 100%, transparent);
          transform: translateX(-2px);
        }
      `}</style>
    </div>
  );
}