import { useEffect } from "react";

interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

export default function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Fehlermeldung"
      onClick={onClose}
    >
      <div
        className="dialog-box"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Ein Fehler ist aufgetreten</h3>
        <p>{message}</p>
        <button
          className="dialog-close-btn"
          onClick={onClose}
          autoFocus
          aria-label="Dialog schließen"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
