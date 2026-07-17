import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { createUnlimitedPlanInvoice, fetchBalance } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";

export function UnlimitedPlanPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const invoice = await createUnlimitedPlanInvoice();
      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        setError("Checkout only works inside Telegram.");
        return;
      }
      const invoiceUrl = invoice.invoice_link?.trim();
      if (!invoiceUrl) {
        throw new Error("The checkout link was empty.");
      }
      if (typeof webApp.openInvoice === "function") {
        webApp.openInvoice(invoiceUrl, async (status) => {
          if (status === "paid") {
            const balance = await fetchBalance();
            setUser({ ...user!, credits: balance.credits, plan: balance.plan ?? "free", subscription_expires_at: balance.subscription_expires_at ?? null });
          }
        });
      } else {
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? "Couldn't start checkout. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();
  }, []);

  return (
    <div className="stora-page">
      <button className="stora-back-btn" onClick={() => navigate(-1)}>
        ‹ Back
      </button>

      <div className="stora-unlimited-card">
        <div className="stora-unlimited-badge">Stora Unlimited</div>
        <h1 className="stora-page-title">Unlock the full power of your vault</h1>
        <p className="stora-unlimited-text">
          Save, search, and retrieve files with zero restrictions. With Stora Unlimited, your credits never get in the way.
        </p>

        <ul className="stora-unlimited-list">
          <li>⚡ Unlimited saving with zero credit drain</li>
          <li>🍿 No ads or daily bonus chasing</li>
          <li>🚀 Instant, friction-free file archiving</li>
        </ul>

        <div className="stora-unlimited-footer">
          <div>
            <div className="stora-unlimited-price">250 Stars</div>
            <div className="stora-unlimited-meta">per month • billed every 30 days</div>
          </div>
          <Button onClick={handleCheckout} disabled={isSubmitting}>
            {isSubmitting ? "Preparing…" : "Subscribe with Telegram Stars"}
          </Button>
        </div>

        {error ? <p className="stora-unlimited-error">{error}</p> : null}
        <p className="stora-unlimited-footnote">
          Active for {user?.plan === "unlimited" ? "your current plan" : "one month"}. After the period ends, your account returns to free credits.
        </p>
      </div>

      <style>{`
        .stora-unlimited-card {
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-xl);
          padding: var(--stora-space-5);
          box-shadow: var(--stora-shadow-card);
        }
        .stora-unlimited-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: var(--stora-radius-pill);
          background: color-mix(in srgb, var(--tg-button-color) 16%, transparent);
          color: var(--tg-button-color);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: var(--stora-space-3);
        }
        .stora-unlimited-text {
          color: var(--tg-hint-color);
          line-height: 1.6;
          margin: 0 0 var(--stora-space-3);
        }
        .stora-unlimited-list {
          margin: 0 0 var(--stora-space-4);
          padding-left: 18px;
          color: var(--tg-text-color);
          display: grid;
          gap: 8px;
        }
        .stora-unlimited-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--stora-space-3);
          margin-top: var(--stora-space-3);
        }
        .stora-unlimited-price {
          font-size: 22px;
          font-weight: 800;
        }
        .stora-unlimited-meta {
          font-size: 13px;
          color: var(--tg-hint-color);
        }
        .stora-unlimited-error {
          margin-top: var(--stora-space-3);
          color: var(--tg-destructive-color);
          font-size: 13px;
        }
        .stora-unlimited-footnote {
          margin-top: var(--stora-space-3);
          font-size: 13px;
          color: var(--tg-hint-color);
        }
        .stora-back-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 15px;
          font-weight: 500;
          padding: 0;
          margin-bottom: var(--stora-space-3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
