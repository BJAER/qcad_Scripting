import { useState } from "react";
import { saveConfig, type Config } from "../services/ConfigService";

interface SettingsProps {
  config: Config;
  onSaved: (updated: Config) => void;
  onStatus: (message: string, type?: "idle" | "success" | "warning" | "error") => void;
  onError: (message: string) => void;
}

export default function Settings({ config, onSaved, onStatus, onError }: SettingsProps) {
  const [form, setForm] = useState<Config>(config);
  const [saving, setSaving] = useState(false);

  function setToolsField(field: keyof Config["tools"], value: string) {
    setForm((prev) => ({ ...prev, tools: { ...prev.tools, [field]: value } }));
  }
  function setProjectsField(field: keyof Config["projects"], value: string) {
    setForm((prev) => ({ ...prev, projects: { ...prev.projects, [field]: value } }));
  }
  function setDocumentsField(field: keyof Config["documents"], value: string) {
    setForm((prev) => ({ ...prev, documents: { ...prev.documents, [field]: value } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveConfig(form);
      onSaved(form);
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
      onStatus("Einstellungen konnten nicht gespeichert werden.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-main" aria-label="Einstellungen">
      <section className="settings-section">
        <h2>Einstellungen</h2>
        <form className="settings-form" onSubmit={handleSave}>

          <fieldset className="settings-fieldset">
            <legend>Programme</legend>
            <label className="settings-label">
              QCAD – Programmpfad
              <input
                className="settings-input"
                type="text"
                value={form.tools.qcad_executable}
                onChange={(e) => setToolsField("qcad_executable", e.target.value)}
                placeholder="/usr/bin/qcad"
              />
            </label>
            <label className="settings-label">
              FreeCAD – Programmpfad
              <input
                className="settings-input"
                type="text"
                value={form.tools.freecad_executable}
                onChange={(e) => setToolsField("freecad_executable", e.target.value)}
                placeholder="/usr/bin/freecad"
              />
            </label>
          </fieldset>

          <fieldset className="settings-fieldset">
            <legend>Projekte</legend>
            <label className="settings-label">
              Stammverzeichnis für Projekte
              <input
                className="settings-input"
                type="text"
                value={form.projects.default_root}
                onChange={(e) => setProjectsField("default_root", e.target.value)}
                placeholder="~/Projekte"
              />
            </label>
          </fieldset>

          <fieldset className="settings-fieldset">
            <legend>Dokumente</legend>
            <label className="settings-label">
              Qualitätshandbuch (URL oder Pfad)
              <input
                className="settings-input"
                type="text"
                value={form.documents.quality_manual_url}
                onChange={(e) => setDocumentsField("quality_manual_url", e.target.value)}
                placeholder="https://... oder ~/Dokumente/QM.pdf"
              />
            </label>
            <label className="settings-label">
              Arbeitsanweisungen (Basis-URL oder Ordner)
              <input
                className="settings-input"
                type="text"
                value={form.documents.work_instruction_base_url}
                onChange={(e) => setDocumentsField("work_instruction_base_url", e.target.value)}
                placeholder="https://... oder ~/Dokumente/Anweisungen"
              />
            </label>
          </fieldset>

          <div className="settings-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Wird gespeichert…" : "Speichern"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
