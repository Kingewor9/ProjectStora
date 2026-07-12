import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createTopUpInvoice, fetchBalance } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";

const TOP_UP_OPTIONS = [20, 50, 100];

interface TopUpSectionProps {
  onTopUpStart: (creditAmount: number) => void;
}

export function TopUpSection({ onTopUpStart }: TopUpSectionProps) {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateCredits = useUserStore((s) => s.updateCredits);

  const handleTopUp = async (creditAmount: number) => {
    setError(null);
    setLoadingAmount(creditAmount);
    try {
      const invoice = await createTopUpInvoice(creditAmount);
      onTopUpStart(invoice.credit_amount);

      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        setError("Top-up only works inside Telegram.");
        return;
      }

      webApp.openInvoice(invoice.invoice_link, async (status) => {
        if (status === "paid") {
          // The bot's successful_payment handler already credited the
          // account server-side — this just refreshes what we show.
          const balance = await fetchBalance();
          updateCredits(balance.credits);
        } else if (status === "failed") {
          setError("Payment failed. Try again.");
        }
        // "cancelled" and "pending" need no message — user backed out or it's still processing.
      });
    } catch (err) {
      console.error("Failed to create top-up invoice:", err);
      setError("Couldn't start checkout. Try again.");
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <section className="stora-section">
      <h2 className="stora-section-title">Top up</h2>
      <p className="stora-section-subtitle">20 Stora Credits = 100 Telegram Stars</p>
      {error && <p className="stora-topup-error">{error}</p>}
      <div className="stora-topup-options">
        {TOP_UP_OPTIONS.map((amount) => (
          <Button
            key={amount}
            variant="secondary"
            onClick={() => handleTopUp(amount)}
            disabled={loadingAmount === amount}
          >
            {loadingAmount === amount ? "..." : `${amount} credits`}
          </Button>
        ))}
      </div>
      <style>{`
        .stora-topup-options {
          display: flex;
          gap: var(--stora-space-2);
          flex-wrap: wrap;
        }
        .stora-topup-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-2);
        }
      `}</style>
    </section>
  );
}
