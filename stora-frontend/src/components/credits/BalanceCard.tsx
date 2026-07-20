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
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: var(--stora-space-6) var(--stora-space-4);
          box-shadow: var(--tg-glass-shadow);
          margin-bottom: var(--stora-space-5);
          position: relative;
          overflow: hidden;
        }
        .stora-balance-card::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(77, 248, 255, 0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .stora-balance-label {
          font-size: 14px;
          color: var(--tg-hint-color);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          position: relative;
          z-index: 1;
        }
        .stora-balance-amount {
          font-size: 48px;
          font-weight: 800;
          color: var(--tg-text-color);
          margin: 4px 0 0;
          text-shadow: 0 0 24px rgba(77, 248, 255, 0.4);
          position: relative;
          z-index: 1;
        }
        .stora-balance-unit {
          font-size: 15px;
          font-weight: 500;
          color: var(--tg-accent-color);
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
