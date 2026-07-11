import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createTopUpInvoice } from "@/api/credits.api";

const TOP_UP_OPTIONS = [20, 50, 100];

interface TopUpSectionProps {
  onTopUpStart: (creditAmount: number) => void;
}

export function TopUpSection({ onTopUpStart }: TopUpSectionProps) {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  const handleTopUp = async (creditAmount: number) => {
    setLoadingAmount(creditAmount);
    try {
      const invoice = await createTopUpInvoice(creditAmount);
      onTopUpStart(invoice.credit_amount);
      // Actual Stars invoice opening happens via Telegram.WebApp.openInvoice
      // once the backend's create_invoice_link is wired to a real link.
    } catch (err) {
      console.error("Failed to create top-up invoice:", err);
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <section className="stora-section">
      <h2 className="stora-section-title">Top up</h2>
      <p className="stora-section-subtitle">20 Stora Credits = 100 Telegram Stars</p>
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
      `}</style>
    </section>
  );
}
