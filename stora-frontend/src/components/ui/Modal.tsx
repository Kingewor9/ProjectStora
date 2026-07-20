import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="stora-modal-overlay" onClick={onClose}>
      <div className="stora-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stora-modal-header">
          <h3>{title}</h3>
          <button className="stora-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="stora-modal-body">{children}</div>
      </div>
      <style>{`
        .stora-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 6, 10, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
          animation: stora-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-modal {
          background: var(--tg-card-bg);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid var(--tg-glass-border);
          border-bottom: none;
          width: 100%;
          max-width: 480px;
          border-radius: 32px 32px 0 0;
          padding: var(--stora-space-5);
          padding-bottom: calc(var(--stora-space-6) + 30px);
          box-shadow: var(--tg-glass-shadow);
          animation: stora-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--stora-space-5);
        }
        .stora-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .stora-modal-close {
          background: color-mix(in srgb, var(--tg-secondary-bg-color) 50%, transparent);
          border: 1px solid var(--tg-glass-border);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: var(--tg-hint-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .stora-modal-close:hover {
          background: var(--tg-secondary-bg-color);
          color: var(--tg-text-color);
        }
        @keyframes stora-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes stora-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .stora-modal-overlay, .stora-modal {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
