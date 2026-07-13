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
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 15px;
          font-weight: 500;
          padding: 0;
          margin-bottom: var(--stora-space-2);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}