interface StartScreenProps {
  onStatus: (message: string, type?: "idle" | "success" | "warning" | "error") => void;
  onError: (message: string) => void;
}

interface HubButton {
  id: string;
  label: string;
  icon: string;
  hint: string;
  action: () => void | Promise<void>;
}

export default function StartScreen({ onStatus, onError }: StartScreenProps) {
  function handleClick(btn: HubButton) {
    return async () => {
      try {
        await btn.action();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onError(msg);
      }
    };
  }

  const buttons: HubButton[] = [
    {
      id: "new-project",
      label: "Neues Projekt",
      icon: "📁",
      hint: "Projektzordner und Struktur anlegen",
      action: () => {
        onStatus("Funktion 'Neues Projekt' wird in Schritt 4 implementiert.", "warning");
      },
    },
    {
      id: "open-project",
      label: "Projekt öffnen",
      icon: "📂",
      hint: "Bestehendes Projekt laden",
      action: () => {
        onStatus("Funktion 'Projekt öffnen' wird in Schritt 4 implementiert.", "warning");
      },
    },
    {
      id: "edit-2d",
      label: "2D-Zeichnung bearbeiten",
      icon: "📐",
      hint: "Öffnet QCAD mit der Projektzeichnung",
      action: () => {
        onStatus("Funktion '2D-Zeichnung bearbeiten' wird in Schritt 5 implementiert.", "warning");
      },
    },
    {
      id: "edit-3d",
      label: "3D-Modell bearbeiten",
      icon: "🔷",
      hint: "Öffnet FreeCAD mit dem Projektmodell",
      action: () => {
        onStatus("Funktion '3D-Modell bearbeiten' wird in Schritt 5 implementiert.", "warning");
      },
    },
    {
      id: "quality-manual",
      label: "Qualitätshandbuch",
      icon: "📋",
      hint: "Qualitätsdokumente anzeigen",
      action: () => {
        onStatus("Funktion 'Qualitätshandbuch' wird in Schritt 6 implementiert.", "warning");
      },
    },
    {
      id: "work-instructions",
      label: "Arbeitsanweisungen",
      icon: "📝",
      hint: "Anweisungen für CAD-Aufgaben",
      action: () => {
        onStatus("Funktion 'Arbeitsanweisungen' wird in Schritt 6 implementiert.", "warning");
      },
    },
    {
      id: "settings",
      label: "Einstellungen",
      icon: "⚙️",
      hint: "Programmpfade und Branding konfigurieren",
      action: () => {
        onStatus("Einstellungen werden in einem späteren Schritt implementiert.", "warning");
      },
    },
    {
      id: "about",
      label: "App-Info / Über",
      icon: "ℹ️",
      hint: "Version und Lizenzinformationen",
      action: () => {
        onStatus("CompanyCAD Hub v0.1.0 – Tauri 2 + React", "success");
      },
    },
  ];

  return (
    <main className="app-main" aria-label="Startseite">
      <section className="start-screen">
        <h2>Was möchten Sie tun?</h2>
        <div className="button-grid" role="list">
          {buttons.map((btn) => (
            <button
              key={btn.id}
              className="hub-button"
              onClick={handleClick(btn)}
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
  );
}
