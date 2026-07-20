import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { configureOnboarding } from "@/api/auth.api";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/Button";

export function OnboardingPage() {
  const [channelId, setChannelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useUserStore((s) => s.setUser);
  const botUsername = import.meta.env.VITE_BOT_USERNAME;
  const navigate = useNavigate();

  const handleConfigure = async () => {
    if (!channelId.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await configureOnboarding({ channel_id: channelId.trim() });
      setUser(user);
      if (user.redirect_shared_token) {
        navigate(`/shared/${user.redirect_shared_token}`);
      }
    } catch (err: any) {
      const errorDetails = err?.response?.data?.detail;
      const fallbackMsg = err.message === "Network Error"
        ? "Network Error: Could not connect to the server (check your CORS or API URL settings)."
        : `Couldn't validate channel. (Debug: ${err.message || 'unknown error'})`;

      setError(errorDetails || fallbackMsg);
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
          font-size: 15px;
          font-weight: 400;
          color: var(--tg-hint-color);
          line-height: 1.5;
          margin-bottom: var(--stora-space-5);
        }
        .stora-onboarding-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 var(--stora-space-6);
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-4);
        }
        .stora-onboarding-steps li {
          display: flex;
          align-items: flex-start;
          gap: var(--stora-space-3);
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-md);
          padding: 16px;
          box-shadow: var(--tg-glass-shadow);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.4;
        }
        .stora-step-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--tg-accent-color) 15%, transparent);
          border: 1px solid rgba(77, 248, 255, 0.2);
          color: var(--tg-accent-color);
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .stora-onboarding-input {
          width: 100%;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-sm);
          padding: 16px;
          font-size: 16px;
          color: var(--tg-text-color);
          margin-bottom: var(--stora-space-4);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .stora-onboarding-input:focus {
          border-color: var(--tg-accent-color);
          box-shadow: 0 0 16px rgba(77, 248, 255, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .stora-onboarding-error {
          font-size: 14px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-4);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
