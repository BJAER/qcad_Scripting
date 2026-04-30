interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

export default function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Fehlermeldung"
      onClick={onClose}
      onKeyDown={handleKeyDown}
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
