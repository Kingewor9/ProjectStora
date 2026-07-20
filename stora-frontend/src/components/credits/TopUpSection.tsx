import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createTopUpInvoice, fetchBalance } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";
import { settings as appSettings } from "@/config/appSettings";

const QUICK_AMOUNTS = [20, 50, 100];

export function TopUpSection() {
  const [amount, setAmount] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateCredits = useUserStore((s) => s.updateCredits);

  const starsCost = amount * appSettings.starsToCreditsRate;

  const handleAmountChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setAmount(0);
      return;
    }
    setAmount(Math.max(0, Math.min(parsed, 100000)));
  };

  const handleTopUp = async () => {
    if (amount <= 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const invoice = await createTopUpInvoice(amount);
      const webApp = window.Telegram?.WebApp;

      if (!webApp) {
        setError("Top-up only works inside Telegram.");
        return;
      }

      const invoiceUrl = invoice.invoice_link?.trim();
      if (!invoiceUrl) {
        throw new Error("The checkout link was empty. Try again.");
      }

      if (typeof webApp.openInvoice !== "function") {
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
        return;
      }

      try {
        webApp.openInvoice(invoiceUrl, async (status) => {
          if (status === "paid") {
            const balance = await fetchBalance();
            updateCredits(balance.credits);
          } else if (status === "failed") {
            setError("Payment failed. Try again.");
          }
        });
      } catch (openInvoiceError) {
        console.warn("openInvoice failed, opening invoice URL directly", openInvoiceError);
        const fallbackWindow = window.open(invoiceUrl, "_blank", "noopener,noreferrer");
        if (!fallbackWindow) {
          window.location.href = invoiceUrl;
        }
      }
    } catch (err: any) {
      console.error("Failed to start top-up checkout:", err);
      const detail = err?.response?.data?.detail;
      // TEMP DEBUG: show the real client-side error too, since this can
      // fail after the backend already succeeded (e.g. openInvoice itself
      // throwing). Revert to a plain generic message once confirmed fixed.
      const raw = err?.message ?? String(err);
      setError(detail ?? `Couldn't start checkout: ${raw}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="stora-section">
      <h2 className="stora-section-title">Top up</h2>
      <p className="stora-section-subtitle">
        {appSettings.starsToCreditsRate} Telegram Star = 1 Stora Credit
      </p>

      <div className="stora-topup-card">
        {error && <p className="stora-topup-error">{error}</p>}

        <div className="stora-topup-input-row">
          <button
            className="stora-topup-step"
            onClick={() => setAmount((a) => Math.max(0, a - 10))}
            aria-label="Decrease amount"
          >
            −
          </button>
          <div className="stora-topup-input-wrap">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={amount || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
            />
            <span className="stora-topup-input-label">credits</span>
          </div>
          <button
            className="stora-topup-step"
            onClick={() => setAmount((a) => a + 10)}
            aria-label="Increase amount"
          >
            +
          </button>
        </div>

        <div className="stora-topup-quick">
          {QUICK_AMOUNTS.map((quick) => (
            <button
              key={quick}
              className={`stora-topup-chip ${amount === quick ? "active" : ""}`}
              onClick={() => setAmount(quick)}
            >
              {quick}
            </button>
          ))}
        </div>

        <Button fullWidth onClick={handleTopUp} disabled={amount <= 0 || isSubmitting}>
          {isSubmitting ? "..." : `Buy for ${starsCost} Stars`}
        </Button>
      </div>

      <style>{`
        .stora-topup-card {
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: var(--stora-space-4);
          box-shadow: var(--tg-glass-shadow);
        }
        .stora-topup-error {
          font-size: 14px;
          font-weight: 500;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
        }
        .stora-topup-input-row {
          display: flex;
          align-items: center;
          gap: var(--stora-space-3);
          margin-bottom: var(--stora-space-4);
        }
        .stora-topup-step {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 1px solid var(--tg-glass-border);
          background: color-mix(in srgb, var(--tg-card-bg) 60%, transparent);
          color: var(--tg-text-color);
          font-size: 22px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .stora-topup-step:hover:hover {
          background: color-mix(in srgb, var(--tg-card-bg) 100%, transparent);
          border-color: var(--tg-accent-color);
          color: var(--tg-accent-color);
        }
        .stora-topup-input-wrap {
          flex: 1;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-md);
          padding: 14px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .stora-topup-input-wrap input {
          width: 100%;
          max-width: 110px;
          border: none;
          outline: none;
          background: transparent;
          text-align: right;
          font-size: 28px;
          font-weight: 800;
          color: var(--tg-text-color);
        }
        .stora-topup-input-label {
          font-size: 15px;
          font-weight: 500;
          color: var(--tg-hint-color);
        }
        .stora-topup-quick {
          display: flex;
          gap: var(--stora-space-3);
          margin-bottom: var(--stora-space-5);
        }
        .stora-topup-chip {
          flex: 1;
          padding: 10px;
          border-radius: var(--stora-radius-pill);
          border: 1px solid var(--tg-glass-border);
          background: rgba(0,0,0,0.2);
          color: var(--tg-text-color);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .stora-topup-chip.active {
          background: color-mix(in srgb, var(--tg-accent-color) 18%, transparent);
          border-color: rgba(77, 248, 255, 0.4);
          color: var(--tg-accent-color);
          box-shadow: 0 0 12px rgba(77, 248, 255, 0.2);
        }
      `}</style>
    </section>
  );
}