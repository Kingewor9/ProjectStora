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
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
          animation: stora-fade-in 0.15s ease;
        }
        .stora-modal {
          background: var(--tg-card-bg);
          width: 100%;
          max-width: 480px;
          border-radius: var(--stora-radius-lg) var(--stora-radius-lg) 0 0;
          padding: var(--stora-space-5);
          padding-bottom: var(--stora-space-6);
          animation: stora-slide-up 0.2s ease;
        }
        .stora-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--stora-space-4);
        }
        .stora-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }
        .stora-modal-close {
          background: var(--tg-secondary-bg-color);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          color: var(--tg-hint-color);
          cursor: pointer;
        }
        @keyframes stora-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes stora-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
