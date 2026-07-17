import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createShare, revokeShare } from "@/api/shares.api";
import type { Share } from "@/types/share.types";

interface ShareFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
  onShareStateChange: (isShared: boolean) => void;
}

export function ShareFolderModal({
  isOpen,
  onClose,
  folderId,
  folderName,
  onShareStateChange,
}: ShareFolderModalProps) {
  const [share, setShare] = useState<Share | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsLoading(true);
    createShare(folderId)
      .then((result) => {
        setShare(result);
        onShareStateChange(true);
      })
      .catch((err) => {
        console.error("Failed to create share:", err);
        setError("Couldn't create a share link. Try again.");
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, folderId]);

  const handleCopy = () => {
    if (!share) return;
    navigator.clipboard.writeText(share.share_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = () => {
    if (!share) return;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(share.share_link)}`;
    window.Telegram?.WebApp && window.open(shareUrl, "_blank");
  };

  const handleRevoke = async () => {
    if (!share) return;
    setIsRevoking(true);
    try {
      await revokeShare(share.token);
      onShareStateChange(false);
      onClose();
    } catch (err) {
      console.error("Failed to revoke share:", err);
      setError("Couldn't revoke this link. Try again.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${folderName}"`}>
      {error && <p className="stora-share-error">{error}</p>}

      {isLoading && <p className="stora-share-loading">Creating share link...</p>}

      {!isLoading && share && (
        <div className="stora-share-body">
          <p className="stora-share-copy">
            Anyone with this link can preview and copy this folder's files into their own
            Stora vault. They won't get access to your channel.
          </p>

          <div className="stora-share-link-row">
            <span className="stora-share-link">{share.share_link.replace("https://", "")}</span>
            <button className="stora-copy-btn" onClick={handleCopy} aria-label="Copy link">
              {copied ? "✓" : "⧉"}
            </button>
          </div>

          <Button fullWidth onClick={handleShare}>
            Share via Telegram
          </Button>

          <button className="stora-revoke-btn" onClick={handleRevoke} disabled={isRevoking}>
            {isRevoking ? "Revoking..." : "Revoke link"}
          </button>
        </div>
      )}

      <style>{`
        .stora-share-loading {
          font-size: 14px;
          color: var(--tg-hint-color);
          text-align: center;
          padding: var(--stora-space-4) 0;
        }
        .stora-share-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
        }
        .stora-share-body {
          display: flex;
          flex-direction: column;
          gap: var(--stora-space-3);
        }
        .stora-share-copy {
          font-size: 13px;
          color: var(--tg-hint-color);
          line-height: 1.5;
          margin: 0;
        }
        .stora-share-link-row {
          display: flex;
          align-items: center;
          gap: var(--stora-space-2);
          background: var(--tg-secondary-bg-color);
          border-radius: var(--stora-radius-pill);
          padding: 10px 14px;
        }
        .stora-share-link {
          flex: 1;
          font-size: 13px;
          color: var(--tg-hint-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .stora-copy-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 16px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .stora-revoke-btn {
          background: none;
          border: none;
          color: var(--tg-destructive-color);
          font-size: 14px;
          font-weight: 600;
          padding: 8px 0;
          cursor: pointer;
          text-align: center;
        }
        .stora-revoke-btn:disabled {
          opacity: 0.6;
        }
      `}</style>
    </Modal>
  );
}
