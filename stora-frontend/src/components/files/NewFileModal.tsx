import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  botUsername: string;
}

export function NewFileModal({ isOpen, onClose, botUsername }: NewFileModalProps) {
  const openChat = () => {
    const link = `https://t.me/${botUsername}`;
    window.Telegram?.WebApp && window.open(link, "_blank");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a file">
      <p className="stora-new-file-copy">
        Forward any text, photo, video, or document to the Stora bot in chat. We'll ask which
        folder to save it in, then it shows up here.
      </p>
      <Button fullWidth onClick={openChat}>
        Open chat with bot
      </Button>
      <style>{`
        .stora-new-file-copy {
          font-size: 14px;
          color: var(--tg-hint-color);
          line-height: 1.5;
          margin: 0 0 var(--stora-space-4);
        }
      `}</style>
    </Modal>
  );
}
