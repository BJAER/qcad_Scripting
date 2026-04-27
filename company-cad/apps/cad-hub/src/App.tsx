import { useState } from "react";
import StartScreen from "./components/StartScreen";
import StatusBar from "./components/StatusBar";
import ErrorDialog from "./components/ErrorDialog";
import logoPlaceholder from "./assets/logo-placeholder.svg";

type StatusType = "idle" | "success" | "warning" | "error";

export default function App() {
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [error, setError] = useState<string | null>(null);

  function handleStatus(message: string, type: StatusType = "idle") {
    setStatusMessage(message);
    setStatusType(type);
  }

  function handleError(message: string) {
    setError(message);
    setStatusMessage(message);
    setStatusType("error");
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logoPlaceholder} alt="CompanyCAD Hub" />
        <h1>CompanyCAD Hub</h1>
      </header>

      <StartScreen onStatus={handleStatus} onError={handleError} />

      <StatusBar message={statusMessage} type={statusType} />

      {error && (
        <ErrorDialog
          message={error}
          onClose={() => {
            setError(null);
            setStatusMessage("Bereit.");
            setStatusType("idle");
          }}
        />
      )}
    </div>
  );
}
