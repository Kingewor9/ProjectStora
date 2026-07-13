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

      webApp.openInvoice(invoice.invoice_link, async (status) => {
        if (status === "paid") {
          const balance = await fetchBalance();
          updateCredits(balance.credits);
        } else if (status === "failed") {
          setError("Payment failed. Try again.");
        }
      });
    } catch (err: any) {
      console.error("Failed to create top-up invoice:", err);
      const detail = err?.response?.data?.detail;
      setError(detail ? `${detail}` : "Couldn't start checkout. Try again.");
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
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
        }
        .stora-topup-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
        }
        .stora-topup-input-row {
          display: flex;
          align-items: center;
          gap: var(--stora-space-2);
          margin-bottom: var(--stora-space-3);
        }
        .stora-topup-step {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 50%;
          border: none;
          background: var(--tg-secondary-bg-color);
          color: var(--tg-text-color);
          font-size: 20px;
          font-weight: 600;
          cursor: pointer;
        }
        .stora-topup-input-wrap {
          flex: 1;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 6px;
          background: var(--tg-secondary-bg-color);
          border-radius: var(--stora-radius-md);
          padding: 12px;
        }
        .stora-topup-input-wrap input {
          width: 100%;
          max-width: 100px;
          border: none;
          outline: none;
          background: transparent;
          text-align: right;
          font-size: 24px;
          font-weight: 700;
          color: var(--tg-text-color);
        }
        .stora-topup-input-label {
          font-size: 14px;
          color: var(--tg-hint-color);
        }
        .stora-topup-quick {
          display: flex;
          gap: var(--stora-space-2);
          margin-bottom: var(--stora-space-4);
        }
        .stora-topup-chip {
          flex: 1;
          padding: 8px;
          border-radius: var(--stora-radius-pill);
          border: none;
          background: var(--tg-secondary-bg-color);
          color: var(--tg-text-color);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .stora-topup-chip.active {
          background: color-mix(in srgb, var(--tg-accent-color) 18%, transparent);
          color: var(--tg-accent-color);
        }
      `}</style>
    </section>
  );
}