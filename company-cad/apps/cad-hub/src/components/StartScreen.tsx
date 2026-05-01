import { useEffect, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import NewProjectDialog from "./NewProjectDialog";
import AboutDialog from "./AboutDialog";
import { openProject } from "../services/ProjectManager";
import { openInQCAD, openInFreeCAD } from "../services/ProcessLauncher";
import type { Config } from "../services/ConfigService";
import type { Project } from "../services/ProjectManager";

type StatusType = "idle" | "success" | "warning" | "error";
type AppView = "start" | "settings" | "documents";

interface StartScreenProps {
  config: Config;
  currentProject: Project | null;
  onProjectChanged: (project: Project | null) => void;
  onRecentRemoved: (projectPath: string) => void;
  onNavigate: (view: AppView) => void;
  onStatus: (message: string, type?: StatusType) => void;
  onError: (message: string) => void;
}

export default function StartScreen({
  config,
  currentProject,
  onProjectChanged,
  onRecentRemoved,
  onNavigate,
  onStatus,
  onError,
}: StartScreenProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inForm = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (e.ctrlKey && e.key.toLowerCase() === "n" && !inForm) {
        e.preventDefault();
        setShowNewProject(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function loadProjectFromPath(path: string) {
    try {
      const project = await openProject(path);
      onProjectChanged(project);
      onStatus(`Projekt „${project.project_name}" geladen.`, "success");
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleOpenProject() {
    const selected = await openDialog({ directory: true, multiple: false, title: "Projektordner wählen" });
    if (!selected) return;
    const path = typeof selected === "string" ? selected : selected[0];
    if (!path) return;
    await loadProjectFromPath(path);
  }

  function handleRecentRemove(e: React.MouseEvent, path: string) {
    e.stopPropagation();
    onRecentRemoved(path);
  }

  async function handleEdit2D() {
    if (!currentProject) {
      onStatus("Bitte zuerst ein Projekt öffnen oder anlegen.", "warning");
      return;
    }
    const qcadFolder = `${currentProject.path}/${currentProject.paths.qcad_2d}`;
    try {
      const result = await openInQCAD(currentProject.path, qcadFolder);
      if (!result.ok) {
        onError(result.errors[0] ?? result.message);
      } else {
        onStatus(result.message, "success");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleEdit3D() {
    if (!currentProject) {
      onStatus("Bitte zuerst ein Projekt öffnen oder anlegen.", "warning");
      return;
    }
    const freecadFolder = `${currentProject.path}/${currentProject.paths.freecad_3d}`;
    try {
      const result = await openInFreeCAD(currentProject.path, freecadFolder);
      if (!result.ok) {
        onError(result.errors[0] ?? result.message);
      } else {
        onStatus(result.message, "success");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleDocuments() {
    const hasAny = config.documents.quality_manual_url || config.documents.work_instruction_base_url;
    if (!hasAny) {
      onStatus("Kein Dokumentenpfad konfiguriert. Bitte Einstellungen öffnen.", "warning");
      return;
    }
    onNavigate("documents");
  }

  const buttons = [
    {
      id: "new-project",
      label: "Neues Projekt",
      icon: "📁",
      hint: "Projektordner und Struktur anlegen",
      action: () => setShowNewProject(true),
    },
    {
      id: "open-project",
      label: "Projekt öffnen",
      icon: "📂",
      hint: "Bestehendes Projekt laden",
      action: handleOpenProject,
    },
    {
      id: "edit-2d",
      label: "2D-Zeichnung bearbeiten",
      icon: "📐",
      hint: currentProject ? `QCAD öffnen für „${currentProject.project_name}"` : "Öffnet QCAD mit der Projektzeichnung",
      action: handleEdit2D,
    },
    {
      id: "edit-3d",
      label: "3D-Modell bearbeiten",
      icon: "🔷",
      hint: currentProject ? `FreeCAD öffnen für „${currentProject.project_name}"` : "Öffnet FreeCAD mit dem Projektmodell",
      action: handleEdit3D,
    },
    {
      id: "quality-manual",
      label: "Qualitätshandbuch",
      icon: "📋",
      hint: "Qualitätsdokumente durchsuchen und öffnen",
      action: handleDocuments,
    },
    {
      id: "work-instructions",
      label: "Arbeitsanweisungen",
      icon: "📝",
      hint: "Anweisungen für CAD-Aufgaben",
      action: handleDocuments,
    },
    {
      id: "settings",
      label: "Einstellungen",
      icon: "⚙️",
      hint: "Programmpfade und Dokumente konfigurieren",
      action: () => onNavigate("settings"),
    },
    {
      id: "about",
      label: "App-Info / Über",
      icon: "ℹ️",
      hint: "Version und Lizenzinformationen",
      action: () => setShowAbout(true),
    },
  ];

  const recents = config.recent_projects ?? [];

  return (
    <>
      <main className="app-main" aria-label="Startseite">
        {recents.length > 0 && (
          <section className="recent-projects" aria-label="Zuletzt verwendete Projekte">
            <h2>Zuletzt verwendet</h2>
            <ul className="recent-list" role="list">
              {recents.map((path) => {
                const name = path.split("/").pop() ?? path;
                return (
                  <li key={path} className="recent-item">
                    <button
                      className="recent-open"
                      onClick={() => loadProjectFromPath(path)}
                      title={path}
                    >
                      <span className="recent-icon" aria-hidden="true">📂</span>
                      <span className="recent-name">{name}</span>
                      <span className="recent-path">{path}</span>
                    </button>
                    <button
                      className="recent-remove"
                      onClick={(e) => handleRecentRemove(e, path)}
                      aria-label={`„${name}" aus der Liste entfernen`}
                      title="Aus der Liste entfernen"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <section className="start-screen">
          <h2>Was möchten Sie tun?</h2>
          <div className="button-grid" role="list">
            {buttons.map((btn) => (
              <button
                key={btn.id}
                className="hub-button"
                onClick={async () => {
                  try {
                    await btn.action();
                  } catch (err) {
                    onError(err instanceof Error ? err.message : String(err));
                  }
                }}
                aria-label={btn.label}
                role="listitem"
              >
                <span className="button-icon" aria-hidden="true">{btn.icon}</span>
                <span className="button-label">{btn.label}</span>
                <span className="button-hint">{btn.hint}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {showNewProject && (
        <NewProjectDialog
          config={config}
          onCreated={(project) => onProjectChanged(project)}
          onClose={() => setShowNewProject(false)}
          onStatus={onStatus}
          onError={onError}
        />
      )}
      {showAbout && (
        <AboutDialog
          appName={config.app.name}
          version={config.app.version}
          onClose={() => setShowAbout(false)}
        />
      )}
    </>
  );
}
