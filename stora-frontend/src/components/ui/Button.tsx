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
          gap: 8px;
          border: 1px solid transparent;
          border-radius: var(--stora-radius-pill);
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-transform: uppercase;
        }
        .stora-btn:active {
          transform: scale(0.96);
        }
        .stora-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        .stora-btn--primary {
          background: linear-gradient(135deg, var(--tg-button-color), color-mix(in srgb, var(--tg-button-color) 70%, white 30%));
          color: var(--tg-button-text-color);
          box-shadow: 0 4px 16px rgba(77, 248, 255, 0.2);
        }
        .stora-btn--primary:hover:not(:disabled) {
          box-shadow: 0 4px 24px rgba(77, 248, 255, 0.4);
        }
        .stora-btn--secondary {
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border-color: var(--tg-glass-border);
          color: var(--tg-text-color);
          box-shadow: var(--tg-glass-shadow);
        }
        .stora-btn--secondary:hover:not(:disabled) {
          background: color-mix(in srgb, var(--tg-card-bg) 80%, white);
        }
        .stora-btn--ghost {
          background: transparent;
          color: var(--tg-link-color);
          padding: 8px 16px;
        }
        .stora-btn--ghost:hover:not(:disabled) {
          background: color-mix(in srgb, var(--tg-link-color) 10%, transparent);
        }
        .stora-btn--destructive {
          background: color-mix(in srgb, var(--tg-destructive-color) 10%, transparent);
          color: var(--tg-destructive-color);
          border-color: color-mix(in srgb, var(--tg-destructive-color) 30%, transparent);
        }
        .stora-btn--destructive:hover:not(:disabled) {
          background: color-mix(in srgb, var(--tg-destructive-color) 20%, transparent);
        }
        .stora-btn--full {
          width: 100%;
        }
      `}</style>
    </button>
  );
}
