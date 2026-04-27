import { useState } from "react";
import { createProject, type ProjectMetadata } from "../services/ProjectManager";
import type { Config } from "../services/ConfigService";
import type { Project } from "../services/ProjectManager";

interface NewProjectDialogProps {
  config: Config;
  onCreated: (project: Project) => void;
  onClose: () => void;
  onStatus: (message: string, type?: "idle" | "success" | "warning" | "error") => void;
  onError: (message: string) => void;
}

export default function NewProjectDialog({ config, onCreated, onClose, onStatus, onError }: NewProjectDialogProps) {
  const [form, setForm] = useState<ProjectMetadata>({
    project_name: "",
    customer: "",
    project_number: "",
  });
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project_name.trim()) {
      onStatus("Bitte gib einen Projektnamen ein.", "warning");
      return;
    }
    if (!config.projects.default_root) {
      onError("Kein Projektstammverzeichnis konfiguriert. Bitte zuerst die Einstellungen öffnen.");
      return;
    }
    setCreating(true);
    try {
      const result = await createProject(form, config.projects.default_root);
      if (!result.ok || !result.project) {
        onError(result.errors[0] ?? result.message);
        return;
      }
      onCreated(result.project);
      onStatus(`Projekt „${result.project.project_name}" wurde angelegt.`, "success");
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-label="Neues Projekt anlegen">
      <div className="dialog-box dialog-box--neutral">
        <h3>Neues Projekt anlegen</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="settings-label">
              Projektnummer (optional)
              <input
                className="settings-input"
                type="text"
                value={form.project_number ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, project_number: e.target.value }))}
                placeholder="z. B. 2024-001"
                autoFocus
              />
            </label>
          </div>
          <div className="form-field">
            <label className="settings-label">
              Projektname *
              <input
                className="settings-input"
                type="text"
                value={form.project_name}
                onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                placeholder="z. B. Gehäuse_Pumpe"
                required
              />
            </label>
          </div>
          <div className="form-field">
            <label className="settings-label">
              Kunde (optional)
              <input
                className="settings-input"
                type="text"
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                placeholder="Kundenname oder leer lassen"
              />
            </label>
          </div>
          <div className="settings-actions">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={creating}>
              Abbrechen
            </button>
            <button className="btn-primary" type="submit" disabled={creating}>
              {creating ? "Wird angelegt…" : "Projekt anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
