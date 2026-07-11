import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { claimDailyBonus, claimSubscribeBonus, claimAdReward } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";
import type { EarnTask } from "@/types/credit.types";

const TASKS: EarnTask[] = [
  { id: "daily", title: "Daily bonus", reward: 5, actionLabel: "Claim" },
  { id: "watch_ad", title: "Watch an ad", reward: 3, actionLabel: "Watch" },
  { id: "invite", title: "Invite a friend", reward: 15, actionLabel: "Share link" },
  { id: "subscribe", title: "Subscribe to our channel", reward: 5, actionLabel: "Subscribe" },
];

export function EarnTaskList() {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateCredits = useUserStore((s) => s.updateCredits);
  const botUsername = import.meta.env.VITE_BOT_USERNAME;
  const telegramId = useUserStore((s) => s.user?.telegram_id);

  const handleTask = async (task: EarnTask) => {
    setError(null);
    setLoadingTask(task.id);
    try {
      switch (task.id) {
        case "daily": {
          const res = await claimDailyBonus();
          updateCredits(res.credits);
          break;
        }
        case "subscribe": {
          const res = await claimSubscribeBonus();
          updateCredits(res.credits);
          break;
        }
        case "watch_ad": {
          // Adsgram/Giga Pub SDK call goes here; on completion it resolves
          // with the reward amount, which we forward to the backend.
          const res = await claimAdReward(task.reward);
          updateCredits(res.credits);
          break;
        }
        case "invite": {
          const link = `https://t.me/${botUsername}?start=ref_${telegramId ?? ""}`;
          window.Telegram?.WebApp && window.open(
            `https://t.me/share/url?url=${encodeURIComponent(link)}`,
            "_blank",
          );
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to complete task ${task.id}:`, err);
      setError("Couldn't complete that right now. Try again shortly.");
    } finally {
      setLoadingTask(null);
    }
  };

  return (
    <section className="stora-section">
      <h2 className="stora-section-title">Earn free credits</h2>
      {error && <p className="stora-earn-error">{error}</p>}
      <div className="stora-earn-list">
        {TASKS.map((task) => (
          <div key={task.id} className="stora-earn-row">
            <div>
              <span className="stora-earn-task-title">{task.title}</span>
              <span className="stora-earn-task-reward">+{task.reward} credits</span>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleTask(task)}
              disabled={loadingTask === task.id}
            >
              {loadingTask === task.id ? "..." : task.actionLabel}
            </Button>
          </div>
        ))}
      </div>
      <style>{`
        .stora-earn-list {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-2);
        }
        .stora-earn-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-md);
          padding: 14px;
          box-shadow: var(--stora-shadow-card);
        }
        .stora-earn-task-title {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: var(--tg-text-color);
        }
        .stora-earn-task-reward {
          display: block;
          font-size: 13px;
          color: var(--tg-hint-color);
        }
        .stora-earn-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-2);
        }
      `}</style>
    </section>
  );
}
