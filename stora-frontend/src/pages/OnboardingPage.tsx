import { useState } from "react";
import { configureOnboarding } from "@/api/auth.api";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/Button";

export function OnboardingPage() {
  const [channelId, setChannelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useUserStore((s) => s.setUser);
  const botUsername = import.meta.env.VITE_BOT_USERNAME;

  const handleConfigure = async () => {
    if (!channelId.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await configureOnboarding({ channel_id: channelId.trim() });
      setUser(user);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Couldn't validate that channel. Check the steps and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stora-page stora-onboarding">
      <h1 className="stora-page-title">Set up your vault</h1>
      <p className="stora-onboarding-intro">
        Stora stores your files in your own private Telegram channel — free, unlimited, and
        fully yours. Three steps to get going:
      </p>

      <ol className="stora-onboarding-steps">
        <li>
          <span className="stora-step-num">1</span>
          Create a new private Telegram channel
        </li>
        <li>
          <span className="stora-step-num">2</span>
          Add <strong>@{botUsername}</strong> as an admin in that channel
        </li>
        <li>
          <span className="stora-step-num">3</span>
          Get your Channel ID from <strong>@userinfobot</strong> and paste it below
        </li>
      </ol>

      <input
        className="stora-onboarding-input"
        type="text"
        placeholder="Paste Channel ID (e.g. -1001234567890)"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
      />

      {error && <p className="stora-onboarding-error">{error}</p>}

      <Button fullWidth onClick={handleConfigure} disabled={!channelId.trim() || isSubmitting}>
        {isSubmitting ? "Validating..." : "Configure"}
      </Button>

      <style>{`
        .stora-onboarding-intro {
          font-size: 14px;
          color: var(--tg-hint-color);
          line-height: 1.5;
          margin-bottom: var(--stora-space-5);
        }
        .stora-onboarding-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 var(--stora-space-5);
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-3);
        }
        .stora-onboarding-steps li {
          display: flex;
          align-items: flex-start;
          gap: var(--stora-space-3);
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-md);
          padding: 14px;
          box-shadow: var(--stora-shadow-card);
          font-size: 14px;
          line-height: 1.4;
        }
        .stora-step-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--tg-accent-color);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .stora-onboarding-input {
          width: 100%;
          background: var(--tg-card-bg);
          border: none;
          border-radius: var(--stora-radius-sm);
          padding: 14px;
          font-size: 15px;
          color: var(--tg-text-color);
          margin-bottom: var(--stora-space-3);
          box-shadow: var(--stora-shadow-card);
          outline: none;
        }
        .stora-onboarding-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
        }
      `}</style>
    </div>
  );
}
