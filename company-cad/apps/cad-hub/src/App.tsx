import { useState, useEffect, useCallback } from "react";
import StartScreen from "./components/StartScreen";
import StatusBar from "./components/StatusBar";
import ErrorDialog from "./components/ErrorDialog";
import Settings from "./components/Settings";
import logoPlaceholder from "./assets/logo-placeholder.svg";
import { loadConfig, validateConfig, type Config } from "./services/ConfigService";
import { DEFAULT_CONFIG } from "./config/defaults";
import { writeLog } from "./services/LoggingService";
import type { Project } from "./services/ProjectManager";

type StatusType = "idle" | "success" | "warning" | "error";
type AppView = "start" | "settings";

export default function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [view, setView] = useState<AppView>("start");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [statusMessage, setStatusMessage] = useState("Wird geladen…");
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleStatus = useCallback((message: string, type: StatusType = "idle") => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setStatusType("error");
  }, []);

  // Config beim Start laden + validieren + app_started loggen
  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      const v = validateConfig(cfg);
      if (v.errors.length > 0) {
        handleStatus(v.errors[0], "warning");
      } else if (v.warnings.length > 0) {
        handleStatus(v.warnings[0], "warning");
      } else {
        handleStatus("Bereit.", "idle");
      }
      writeLog({
        action: "app_started",
        project_id: "",
        input: {},
        result: v.valid ? "success" : "warning",
        warnings: v.warnings,
        errors: v.errors,
      }).catch(() => {/* Log-Fehler still ignorieren beim Start */});
    });
  }, [handleStatus]);

  function handleConfigSaved(updated: Config) {
    setConfig(updated);
    setView("start");
    handleStatus("Einstellungen gespeichert.", "success");
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logoPlaceholder} alt="CompanyCAD Hub" />
        <h1>CompanyCAD Hub</h1>
        {currentProject && (
          <span className="active-project-badge" title={currentProject.path}>
            📂 {currentProject.project_name}
          </span>
        )}
        <nav className="header-nav">
          {view !== "start" && (
            <button className="nav-btn" onClick={() => setView("start")}>← Zurück</button>
          )}
        </nav>
      </header>

      {view === "settings" ? (
        <Settings
          config={config}
          onSaved={handleConfigSaved}
          onStatus={handleStatus}
          onError={handleError}
        />
      ) : (
        <StartScreen
          config={config}
          currentProject={currentProject}
          onProjectChanged={setCurrentProject}
          onNavigate={setView}
          onStatus={handleStatus}
          onError={handleError}
        />
      )}

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
