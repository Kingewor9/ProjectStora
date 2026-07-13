import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TaskCard } from "./TaskCard";
import { claimDailyBonus, claimSubscribeBonus, claimAdReward } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";
import { settings as appSettings } from "@/config/appSettings";

export function EarnTaskList() {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [subscribeClaimed, setSubscribeClaimed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCredits = useUserStore((s) => s.updateCredits);
  const telegramId = useUserStore((s) => s.user?.telegram_id);
  const botUsername = import.meta.env.VITE_BOT_USERNAME;

  const referralLink = `t.me/${botUsername}?start=ref_${telegramId ?? ""}`;

  const withLoading = async (taskId: string, fn: () => Promise<void>) => {
    setError(null);
    setLoadingTask(taskId);
    try {
      await fn();
    } catch (err) {
      console.error(`Task ${taskId} failed:`, err);
      setError("Couldn't complete that right now. Try again shortly.");
    } finally {
      setLoadingTask(null);
    }
  };

  const handleDailyBonus = () =>
    withLoading("daily", async () => {
      const res = await claimDailyBonus();
      updateCredits(res.credits);
      setDailyClaimed(true);
    });

  const handleWatchAd = () =>
    withLoading("watch_ad", async () => {
      // Adsgram/Giga Pub SDK call goes here; on completion it resolves
      // with the reward amount, which we then forward to the backend.
      const res = await claimAdReward(appSettings.adWatchReward);
      updateCredits(res.credits);
    });

  const handleSubscribeCheck = () =>
    withLoading("subscribe", async () => {
      const res = await claimSubscribeBonus();
      updateCredits(res.credits);
      setSubscribeClaimed(true);
    });

  const handleGoToChannel = () => {
    window.Telegram?.WebApp && window.open(`https://t.me/${appSettings.officialChannelUsername}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShareInvite = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://${referralLink}`)}`;
    window.Telegram?.WebApp && window.open(shareUrl, "_blank");
  };

  return (
    <section className="stora-section">
      <h2 className="stora-section-title">Earn free credits</h2>
      {error && <p className="stora-earn-error">{error}</p>}

      <TaskCard
        icon="🎁"
        title="Daily Bonus"
        subtitle="Claim a free bonus once every 24 hours"
        reward={appSettings.dailyBonus}
      >
        <Button
          fullWidth
          variant="secondary"
          onClick={handleDailyBonus}
          disabled={loadingTask === "daily" || dailyClaimed}
        >
          {dailyClaimed ? "Claimed" : loadingTask === "daily" ? "..." : "Claim"}
        </Button>
      </TaskCard>

      <TaskCard
        icon="👥"
        title="Invite friends"
        subtitle="Get a reward for each friend who joins via your link"
        reward={appSettings.inviteBonus}
      >
        <div className="stora-invite-card-body">
          <div className="stora-referral-row">
            <span className="stora-referral-link">{referralLink}</span>
            <button className="stora-copy-btn" onClick={handleCopyLink} aria-label="Copy link">
              {copied ? "✓" : "⧉"}
            </button>
          </div>
          <Button fullWidth variant="secondary" onClick={handleShareInvite}>
            Invite friends
          </Button>
        </div>
      </TaskCard>

      <TaskCard
        icon="🎬"
        title="Watch an ad"
        subtitle="Watch a short rewarded video to earn credits"
        reward={appSettings.adWatchReward}
      >
        <Button fullWidth variant="secondary" onClick={handleWatchAd} disabled={loadingTask === "watch_ad"}>
          {loadingTask === "watch_ad" ? "..." : "Watch"}
        </Button>
      </TaskCard>

      <TaskCard
        icon="📣"
        title="Subscribe to our channel"
        subtitle="Stay updated with news and announcements"
        reward={appSettings.subscribeBonus}
      >
        <Button fullWidth variant="secondary" onClick={handleGoToChannel}>
          Go to channel
        </Button>
        <Button
          fullWidth
          onClick={handleSubscribeCheck}
          disabled={loadingTask === "subscribe" || subscribeClaimed}
        >
          {subscribeClaimed ? "Claimed" : loadingTask === "subscribe" ? "..." : "Check"}
        </Button>
      </TaskCard>

      <style>{`
        .stora-earn-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-2);
        }
        .stora-invite-card-body {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-2);
          width: 100%;
        }
        .stora-referral-row {
          display: flex;
          align-items: center;
          gap: var(--stora-space-2);
          background: var(--tg-secondary-bg-color);
          border-radius: var(--stora-radius-pill);
          padding: 10px 14px;
        }
        .stora-referral-link {
          flex: 1;
          font-size: 13px;
          color: var(--tg-hint-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .stora-copy-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 16px;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </section>
  );
}