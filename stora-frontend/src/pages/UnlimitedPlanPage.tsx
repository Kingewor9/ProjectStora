import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Infinity as InfinityIcon, Zap, ShieldCheck, XCircle, Check } from "lucide-react";
import { createUnlimitedPlanInvoice, fetchBalance } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";

const FEATURES = [
  { icon: InfinityIcon, text: "Unlimited file saves — credits never run out" },
  { icon: Zap, text: "No ads or daily bonus grinding to earn credits" },
  { icon: ShieldCheck, text: "Instant, friction-free archiving every time" },
  { icon: XCircle, text: "Cancel anytime — no lock-in" },
];

export function UnlimitedPlanPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentlyUnlimited = user?.plan === "unlimited";

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
            setUser({
              ...user!,
              credits: balance.credits,
              plan: balance.plan ?? "free",
              subscription_expires_at: balance.subscription_expires_at ?? null,
            });
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
    <div className="stora-unlimited-page">
      <button className="stora-unlimited-back" onClick={() => navigate(-1)}>
        ‹ Back
      </button>

      <h1 className="stora-unlimited-headline">Get more from Stora</h1>
      <p className="stora-unlimited-subhead">Subscribe now, cancel anytime</p>

      <div className="stora-unlimited-billing-pill">Billed monthly</div>

      <div className="stora-unlimited-card">
        <div className="stora-unlimited-card-header">
          <span className="stora-unlimited-plan-name">Unlimited</span>
          <span className="stora-unlimited-most-popular">MOST POPULAR</span>
        </div>
        <p className="stora-unlimited-card-desc">
          Save, search, and retrieve files with zero restrictions — your credits never get in
          the way again.
        </p>

        <div className="stora-unlimited-price-row">
          <span className="stora-unlimited-price">{user?.plan ? "150" : "150"}</span>
          <span className="stora-unlimited-price-star">⭐</span>
          <span className="stora-unlimited-price-period">/mo</span>
        </div>
        <p className="stora-unlimited-billed-note">Billed every 30 days via Telegram Stars</p>

        <ul className="stora-unlimited-feature-list">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {isCurrentlyUnlimited ? (
        <div className="stora-unlimited-active-state">
          <Check size={18} strokeWidth={2.4} />
          <span>You're on the Unlimited plan</span>
        </div>
      ) : (
        <button className="stora-unlimited-cta" onClick={handleCheckout} disabled={isSubmitting}>
          {isSubmitting ? "Preparing…" : "Subscribe to Unlimited"}
        </button>
      )}

      {error ? <p className="stora-unlimited-error">{error}</p> : null}

      <p className="stora-unlimited-footnote">
        Paid entirely with Telegram Stars — no card required. After 30 days, your account
        automatically returns to free credits unless renewed.
      </p>

      <style>{`
        .stora-unlimited-page {
          min-height: 100vh;
          background: var(--tg-bg-color);
          color: var(--tg-text-color);
          padding: var(--stora-space-4) var(--stora-space-4) 110px;
          animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stora-unlimited-back {
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
        .stora-unlimited-back:hover {
          background: color-mix(in srgb, var(--tg-card-bg) 100%, transparent);
          transform: translateX(-2px);
        }
        .stora-unlimited-headline {
          font-size: 32px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }
        .stora-unlimited-subhead {
          font-size: 16px;
          color: var(--tg-hint-color);
          margin: 0 0 var(--stora-space-4);
          font-weight: 400;
        }
        .stora-unlimited-billing-pill {
          display: inline-flex;
          padding: 8px 16px;
          border-radius: var(--stora-radius-pill);
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--tg-glass-border);
          color: var(--tg-text-color);
          font-size: 13px;
          font-weight: 700;
          margin-bottom: var(--stora-space-4);
        }
        .stora-unlimited-card {
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: var(--stora-space-5);
          margin-bottom: var(--stora-space-4);
          box-shadow: var(--tg-glass-shadow);
          position: relative;
          overflow: hidden;
        }
        .stora-unlimited-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 100%;
          background: linear-gradient(135deg, rgba(77, 248, 255, 0.1), transparent 50%);
          pointer-events: none;
        }
        .stora-unlimited-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: var(--stora-space-3);
          position: relative;
          z-index: 1;
        }
        .stora-unlimited-plan-name {
          font-size: 26px;
          font-weight: 800;
        }
        .stora-unlimited-most-popular {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--tg-accent-color);
          background: color-mix(in srgb, var(--tg-accent-color) 18%, transparent);
          border-radius: var(--stora-radius-pill);
          padding: 4px 10px;
          box-shadow: 0 0 12px rgba(77, 248, 255, 0.3);
        }
        .stora-unlimited-card-desc {
          font-size: 15px;
          color: var(--tg-hint-color);
          line-height: 1.5;
          margin: 0 0 var(--stora-space-4);
          position: relative;
          z-index: 1;
        }
        .stora-unlimited-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 2px;
          position: relative;
          z-index: 1;
        }
        .stora-unlimited-price {
          font-size: 42px;
          font-weight: 800;
        }
        .stora-unlimited-price-star {
          font-size: 24px;
        }
        .stora-unlimited-price-period {
          font-size: 15px;
          color: var(--tg-hint-color);
          margin-left: 2px;
        }
        .stora-unlimited-billed-note {
          font-size: 13px;
          color: var(--tg-hint-color);
          margin: 0 0 var(--stora-space-5);
          position: relative;
          z-index: 1;
        }
        .stora-unlimited-feature-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        .stora-unlimited-feature-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 15px;
          font-weight: 500;
          color: var(--tg-text-color);
          line-height: 1.4;
        }
        .stora-unlimited-feature-list svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--tg-accent-color);
          filter: drop-shadow(0 0 8px rgba(77, 248, 255, 0.4));
        }
        .stora-unlimited-cta {
          display: block;
          width: 100%;
          background: linear-gradient(135deg, var(--tg-button-color), color-mix(in srgb, var(--tg-button-color) 70%, white 30%));
          color: var(--tg-button-text-color);
          border: none;
          border-radius: var(--stora-radius-pill);
          padding: 18px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          margin-bottom: var(--stora-space-3);
          box-shadow: 0 4px 24px rgba(77, 248, 255, 0.4);
          text-transform: uppercase;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-unlimited-cta:hover:not(:disabled) {
          box-shadow: 0 8px 32px rgba(77, 248, 255, 0.6);
          transform: translateY(-2px);
        }
        .stora-unlimited-cta:active:not(:disabled) {
          transform: scale(0.97);
        }
        .stora-unlimited-cta:disabled {
          opacity: 0.6;
          filter: grayscale(0.5);
          cursor: wait;
        }
        .stora-unlimited-active-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: color-mix(in srgb, var(--tg-accent-color) 10%, transparent);
          border: 1px solid rgba(77, 248, 255, 0.2);
          border-radius: var(--stora-radius-pill);
          padding: 16px;
          font-size: 15px;
          font-weight: 700;
          color: var(--tg-accent-color);
          margin-bottom: var(--stora-space-3);
        }
        .stora-unlimited-error {
          color: var(--tg-destructive-color);
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 var(--stora-space-3);
        }
        .stora-unlimited-footnote {
          font-size: 12px;
          color: var(--tg-hint-color);
          text-align: center;
          line-height: 1.5;
          margin: 0;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}