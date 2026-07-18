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
          min-height: 100%;
          background: #0b0b0d;
          color: #ffffff;
          padding: var(--stora-space-4) var(--stora-space-4) 64px;
        }
        .stora-unlimited-back {
          background: none;
          border: none;
          color: #8e8e93;
          font-size: 15px;
          font-weight: 500;
          padding: 0;
          margin-bottom: var(--stora-space-4);
          cursor: pointer;
        }
        .stora-unlimited-headline {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 6px;
        }
        .stora-unlimited-subhead {
          font-size: 16px;
          color: #9a9aa0;
          margin: 0 0 var(--stora-space-4);
        }
        .stora-unlimited-billing-pill {
          display: inline-flex;
          padding: 8px 16px;
          border-radius: var(--stora-radius-pill);
          background: #1c1c1e;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: var(--stora-space-4);
        }
        .stora-unlimited-card {
          border: 1px solid #2c2c2e;
          border-radius: var(--stora-radius-xl);
          padding: var(--stora-space-5);
          margin-bottom: var(--stora-space-4);
        }
        .stora-unlimited-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: var(--stora-space-3);
        }
        .stora-unlimited-plan-name {
          font-size: 24px;
          font-weight: 800;
        }
        .stora-unlimited-most-popular {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #6ea8ff;
          background: color-mix(in srgb, #6ea8ff 18%, transparent);
          border-radius: var(--stora-radius-pill);
          padding: 4px 10px;
        }
        .stora-unlimited-card-desc {
          font-size: 14px;
          color: #9a9aa0;
          line-height: 1.5;
          margin: 0 0 var(--stora-space-4);
        }
        .stora-unlimited-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 2px;
        }
        .stora-unlimited-price {
          font-size: 40px;
          font-weight: 800;
        }
        .stora-unlimited-price-star {
          font-size: 22px;
        }
        .stora-unlimited-price-period {
          font-size: 15px;
          color: #9a9aa0;
          margin-left: 2px;
        }
        .stora-unlimited-billed-note {
          font-size: 13px;
          color: #6e6e73;
          margin: 0 0 var(--stora-space-4);
        }
        .stora-unlimited-feature-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .stora-unlimited-feature-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          color: #e5e5e7;
          line-height: 1.4;
        }
        .stora-unlimited-feature-list svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #6ea8ff;
        }
        .stora-unlimited-cta {
          display: block;
          width: 100%;
          background: #ffffff;
          color: #0b0b0d;
          border: none;
          border-radius: var(--stora-radius-pill);
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: var(--stora-space-3);
        }
        .stora-unlimited-cta:disabled {
          opacity: 0.6;
        }
        .stora-unlimited-active-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #1c1c1e;
          border-radius: var(--stora-radius-pill);
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          color: #6ea8ff;
          margin-bottom: var(--stora-space-3);
        }
        .stora-unlimited-error {
          color: #ff6961;
          font-size: 13px;
          text-align: center;
          margin: 0 0 var(--stora-space-3);
        }
        .stora-unlimited-footnote {
          font-size: 12px;
          color: #6e6e73;
          text-align: center;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}