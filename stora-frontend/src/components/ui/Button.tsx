import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`stora-btn stora-btn--${variant} ${fullWidth ? "stora-btn--full" : ""} ${className}`}
      {...rest}
    >
      {children}
      <style>{`
        .stora-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          border-radius: var(--stora-radius-pill);
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .stora-btn:active {
          transform: scale(0.97);
        }
        .stora-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .stora-btn--primary {
          background: var(--tg-button-color);
          color: var(--tg-button-text-color);
        }
        .stora-btn--secondary {
          background: var(--tg-secondary-bg-color);
          color: var(--tg-text-color);
        }
        .stora-btn--ghost {
          background: transparent;
          color: var(--tg-link-color);
          padding: 8px 12px;
        }
        .stora-btn--destructive {
          background: transparent;
          color: var(--tg-destructive-color);
        }
        .stora-btn--full {
          width: 100%;
        }
      `}</style>
    </button>
  );
}
