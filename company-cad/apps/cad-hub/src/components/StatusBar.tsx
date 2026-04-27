interface StatusBarProps {
  message: string;
  type?: "idle" | "success" | "warning" | "error";
}

export default function StatusBar({ message, type = "idle" }: StatusBarProps) {
  const cssClass = `status-bar${type !== "idle" ? ` status-${type}` : ""}`;
  const displayMessage = message || "Bereit.";

  return (
    <div className={cssClass} role="status" aria-live="polite">
      <span className="status-indicator" aria-hidden="true" />
      <span>{displayMessage}</span>
    </div>
  );
}
