import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function NewFolderModal({ isOpen, onClose, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onCreate(trimmed);
      setName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New folder">
      <input
        className="stora-modal-input"
        type="text"
        placeholder="Folder name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <Button fullWidth onClick={handleCreate} disabled={!name.trim() || isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </Button>
      <style>{`
        .stora-modal-input {
          width: 100%;
          background: var(--tg-secondary-bg-color);
          border: none;
          border-radius: var(--stora-radius-sm);
          padding: 14px;
          font-size: 15px;
          color: var(--tg-text-color);
          margin-bottom: var(--stora-space-4);
          outline: none;
        }
      `}</style>
    </Modal>
  );
}
