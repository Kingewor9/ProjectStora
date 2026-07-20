import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { TaskCard } from "./TaskCard";
import { claimDailyBonus, claimSubscribeBonus, claimAdReward } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";
import { settings as appSettings } from "@/config/appSettings";
import { showRewardedAd } from "@/utils/rewardedAd";

// ── helpers ─────────────────────────────────────────────────────────────────

/** Compute seconds remaining until `targetIso` (UTC ISO string). */
function secsUntil(targetIso: string): number {
  return Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
}

/** Format seconds as hh:mm:ss */
function fmtCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// ── component ────────────────────────────────────────────────────────────────

export function EarnTaskList() {
  const updateCredits = useUserStore((s) => s.updateCredits);
  const user = useUserStore((s) => s.user);
  const telegramId = user?.telegram_id;
  const botUsername = import.meta.env.VITE_BOT_USERNAME;
  const referralLink = `t.me/${botUsername}?start=ref_${telegramId ?? ""}`;

  // ── state ──────────────────────────────────────────────────────────────────

  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Subscribe: seed from server so state survives refresh
  const [subscribeClaimed, setSubscribeClaimed] = useState(
    () => user?.subscribe_bonus_claimed ?? false
  );

  // Daily bonus: nextClaimAt is the UTC ISO timestamp when the next claim opens
  // Seed from server if last_daily_claim is present
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(() => {
    if (!user?.last_daily_claim) return null;
    const next = new Date(new Date(user.last_daily_claim).getTime() + 24 * 3600 * 1000).toISOString();
    return secsUntil(next) > 0 ? next : null;
  });
  const [countdown, setCountdown] = useState<number>(() =>
    nextClaimAt ? secsUntil(nextClaimAt) : 0
  );

  // Sync subscribe state if the user object updates (e.g. after session refresh)
  useEffect(() => {
    if (user?.subscribe_bonus_claimed) setSubscribeClaimed(true);
  }, [user?.subscribe_bonus_claimed]);

  // ── countdown tick ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!nextClaimAt) return;

    const tick = () => {
      const secs = secsUntil(nextClaimAt);
      setCountdown(secs);
      if (secs === 0) setNextClaimAt(null); // cooldown over — reveal Claim button
    };

    tick(); // run immediately so there's no 1-second blank
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextClaimAt]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const withLoading = useCallback(
    async (taskId: string, fn: () => Promise<void>) => {
      setError(null);
      setLoadingTask(taskId);
      try {
        await fn();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Couldn't complete that right now. Try again shortly.";
        setError(msg);
      } finally {
        setLoadingTask(null);
      }
    },
    []
  );

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleDailyBonus = () =>
    withLoading("daily", async () => {
      const res = await claimDailyBonus();
      updateCredits(res.credits);
      if (res.next_claim_at) {
        setNextClaimAt(res.next_claim_at);
        setCountdown(secsUntil(res.next_claim_at));
      }
    });

  const handleWatchAd = () =>
    withLoading("watch_ad", async () => {
      await showRewardedAd();
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
    window.open(`https://t.me/${appSettings.officialChannelUsername}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShareInvite = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://${referralLink}`)}`;
    window.open(shareUrl, "_blank");
  };

  // ── render ─────────────────────────────────────────────────────────────────

  const dailyCoolingDown = !!nextClaimAt && countdown > 0;

  return (
    <section className="stora-section">
      <h2 className="stora-section-title">Earn free credits</h2>
      {error && <p className="stora-earn-error">{error}</p>}

      {/* ── Daily Bonus ── */}
      <TaskCard
        icon="🎁"
        title="Daily Bonus"
        subtitle="Claim a free bonus once every 24 hours"
        reward={appSettings.dailyBonus}
      >
        {dailyCoolingDown ? (
          <div className="stora-countdown-wrap">
            <span className="stora-countdown-label">Next claim in</span>
            <span className="stora-countdown">{fmtCountdown(countdown)}</span>
          </div>
        ) : (
          <Button
            fullWidth
            variant="secondary"
            onClick={handleDailyBonus}
            disabled={loadingTask === "daily"}
          >
            {loadingTask === "daily" ? "Claiming…" : "Claim"}
          </Button>
        )}
      </TaskCard>

      {/* ── Invite Friends ── */}
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

      {/* ── Watch Ad ── */}
      <TaskCard
        icon="🎬"
        title="Watch an ad"
        subtitle="Watch a short rewarded video to earn credits"
        reward={appSettings.adWatchReward}
      >
        <Button fullWidth variant="secondary" onClick={handleWatchAd} disabled={loadingTask === "watch_ad"}>
          {loadingTask === "watch_ad" ? "Loading…" : "Watch"}
        </Button>
      </TaskCard>

      {/* ── Subscribe ── */}
      <TaskCard
        icon="📣"
        title="Subscribe to our channel"
        subtitle="Stay updated with news and announcements"
        reward={appSettings.subscribeBonus}
      >
        {subscribeClaimed ? (
          <div className="stora-subscribed-badge">✅ Claimed — thanks for subscribing!</div>
        ) : (
          <>
            <Button fullWidth variant="secondary" onClick={handleGoToChannel}>
              Go to channel
            </Button>
            <Button
              fullWidth
              onClick={handleSubscribeCheck}
              disabled={loadingTask === "subscribe"}
            >
              {loadingTask === "subscribe" ? "Checking…" : "Check"}
            </Button>
          </>
        )}
      </TaskCard>

      <style>{`
        .stora-earn-error {
          font-size: 14px;
          font-weight: 500;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
        }
        .stora-invite-card-body {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-3);
          width: 100%;
        }
        .stora-referral-row {
          display: flex;
          align-items: center;
          gap: var(--stora-space-2);
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-pill);
          padding: 12px 16px;
        }
        .stora-referral-link {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--tg-hint-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .stora-copy-btn {
          background: none;
          border: none;
          color: var(--tg-accent-color);
          font-size: 16px;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        /* countdown */
        .stora-countdown-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 0;
          width: 100%;
          background: rgba(0,0,0,0.1);
          border-radius: var(--stora-radius-md);
        }
        .stora-countdown-label {
          font-size: 12px;
          color: var(--tg-hint-color);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .stora-countdown {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--tg-text-color);
          font-variant-numeric: tabular-nums;
          text-shadow: 0 0 12px rgba(77, 248, 255, 0.3);
        }
        /* subscribe claimed */
        .stora-subscribed-badge {
          font-size: 14px;
          font-weight: 600;
          color: var(--tg-accent-color);
          background: color-mix(in srgb, var(--tg-accent-color) 15%, transparent);
          border: 1px solid rgba(77, 248, 255, 0.2);
          border-radius: var(--stora-radius-md);
          text-align: center;
          padding: 12px;
          width: 100%;
        }
      `}</style>
    </section>
  );
}