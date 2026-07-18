import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useUserStore } from "@/store/userStore";
import { sendBroadcast } from "@/api/admin.api";

export function BroadcastPage() {
  const isAdmin = useUserStore((s) => s.user?.is_admin ?? false);

  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Backend enforces this regardless — this is just so a non-admin
  // doesn't land on a broken page if they guess the URL.
  if (!isAdmin) {
    return <Navigate to="/folders" replace />;
  }

  const hasLink = linkUrl.trim().length > 0;
  const canSend = text.trim().length > 0 && (!hasLink || ctaText.trim().length > 0);

  const resetForm = () => {
    setText("");
    setLinkUrl("");
    setCtaText("");
    setImageUrl("");
  };

  const handleSend = async () => {
    setError(null);
    setIsSending(true);
    try {
      const result = await sendBroadcast({
        text: text.trim(),
        link_url: hasLink ? linkUrl.trim() : null,
        cta_text: hasLink ? ctaText.trim() : null,
        image_url: imageUrl.trim() || null,
      });
      setSuccessMessage(
        `Broadcast started — sending to ${result.total_recipients} users. ` +
        `You'll get a DM here with the final results once it's done.`
      );
      resetForm();
    } catch (err: any) {
      console.error("Failed to send broadcast:", err);
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(", ") : detail ?? "Couldn't send the broadcast. Try again.");
    } finally {
      setIsSending(false);
      setConfirmOpen(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="stora-page">
      <h1 className="stora-page-title">Broadcast</h1>
      <p className="stora-broadcast-subtitle">Send a message to every Stora user.</p>

      {successMessage && <p className="stora-broadcast-success">{successMessage}</p>}
      {error && <p className="stora-broadcast-error">{error}</p>}

      <div className="stora-broadcast-card">
        <label className="stora-broadcast-label" htmlFor="broadcast-text">
          Message
        </label>
        <textarea
          id="broadcast-text"
          className="stora-broadcast-textarea"
          placeholder="What do you want to tell your users?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
        />

        <label className="stora-broadcast-label" htmlFor="broadcast-image">
          Image URL <span className="stora-broadcast-optional">(optional)</span>
        </label>
        <input
          id="broadcast-image"
          className="stora-broadcast-input"
          type="text"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <label className="stora-broadcast-label" htmlFor="broadcast-link">
          Link <span className="stora-broadcast-optional">(optional)</span>
        </label>
        <input
          id="broadcast-link"
          className="stora-broadcast-input"
          type="text"
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />

        {hasLink && (
          <>
            <label className="stora-broadcast-label" htmlFor="broadcast-cta">
              Button text
            </label>
            <input
              id="broadcast-cta"
              className="stora-broadcast-input"
              type="text"
              placeholder="e.g. Open Stora"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
            />
          </>
        )}
      </div>

      <div className="stora-broadcast-actions">
        <Button
          fullWidth
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend || isSending}
        >
          {isSending ? "Sending..." : "Send broadcast"}
        </Button>
        <Button fullWidth variant="secondary" onClick={handleCancel} disabled={isSending}>
          Cancel
        </Button>
      </div>

      <Modal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} title="Send to all users?">
        <p className="stora-broadcast-confirm-copy">
          This message will be sent to every registered Stora user. This can't be undone once
          it starts. Are you sure?
        </p>
        <Button fullWidth onClick={handleSend} disabled={isSending}>
          {isSending ? "Sending..." : "Yes, send it"}
        </Button>
        <button className="stora-broadcast-confirm-cancel" onClick={() => setConfirmOpen(false)}>
          Never mind
        </button>
      </Modal>

      <style>{`
        .stora-broadcast-subtitle {
          font-size: 14px;
          color: var(--tg-hint-color);
          margin: -8px 0 var(--stora-space-4);
        }
        .stora-broadcast-success {
          font-size: 13px;
          color: var(--tg-accent-color);
          background: color-mix(in srgb, var(--tg-accent-color) 10%, transparent);
          border-radius: var(--stora-radius-sm);
          padding: 10px 14px;
          margin: 0 0 var(--stora-space-3);
          line-height: 1.4;
        }
        .stora-broadcast-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
        }
        .stora-broadcast-card {
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
          margin-bottom: var(--stora-space-4);
          display: flex;
          flex-direction: column;
        }
        .stora-broadcast-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--tg-text-color);
          margin: var(--stora-space-3) 0 6px;
        }
        .stora-broadcast-label:first-child {
          margin-top: 0;
        }
        .stora-broadcast-optional {
          font-weight: 400;
          color: var(--tg-hint-color);
        }
        .stora-broadcast-textarea,
        .stora-broadcast-input {
          width: 100%;
          background: var(--tg-secondary-bg-color);
          border: none;
          border-radius: var(--stora-radius-sm);
          padding: 12px 14px;
          font-size: 14px;
          color: var(--tg-text-color);
          outline: none;
          font-family: inherit;
          resize: vertical;
        }
        .stora-broadcast-actions {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-2);
        }
        .stora-broadcast-confirm-copy {
          font-size: 14px;
          color: var(--tg-hint-color);
          line-height: 1.5;
          margin: 0 0 var(--stora-space-4);
        }
        .stora-broadcast-confirm-cancel {
          display: block;
          width: 100%;
          background: none;
          border: none;
          color: var(--tg-hint-color);
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          padding: var(--stora-space-3) 0 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
