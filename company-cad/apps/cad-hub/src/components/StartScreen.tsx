import { useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import NewProjectDialog from "./NewProjectDialog";
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
  onNavigate: (view: AppView) => void;
  onStatus: (message: string, type?: StatusType) => void;
  onError: (message: string) => void;
}

export default function StartScreen({
  config,
  currentProject,
  onProjectChanged,
  onNavigate,
  onStatus,
  onError,
}: StartScreenProps) {
  const [showNewProject, setShowNewProject] = useState(false);

  async function handleOpenProject() {
    const selected = await openDialog({ directory: true, multiple: false, title: "Projektordner wählen" });
    if (!selected) return;
    const path = typeof selected === "string" ? selected : selected[0];
    if (!path) return;
    try {
      const project = await openProject(path);
      onProjectChanged(project);
      onStatus(`Projekt „${project.project_name}" geladen.`, "success");
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
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
      action: () => onStatus("CompanyCAD Hub v0.1.0 – Tauri 2 + React + Rust", "success"),
    },
  ];

  return (
    <>
      <main className="app-main" aria-label="Startseite">
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
    </>
  );
}
