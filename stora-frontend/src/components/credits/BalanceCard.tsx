interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="stora-balance-card">
      <span className="stora-balance-label">My balance</span>
      <span className="stora-balance-amount">{balance}</span>
      <span className="stora-balance-unit">Stora Credits</span>
      <style>{`
        .stora-balance-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-6) var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
          margin-bottom: var(--stora-space-5);
        }
        .stora-balance-label {
          font-size: 13px;
          color: var(--tg-hint-color);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stora-balance-amount {
          font-size: 44px;
          font-weight: 800;
          color: var(--tg-text-color);
          margin: 8px 0 0;
        }
        .stora-balance-unit {
          font-size: 14px;
          color: var(--tg-hint-color);
        }
      `}</style>
    </div>
  );
}
