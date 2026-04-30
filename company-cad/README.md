# CompanyCAD Hub

Desktop-Workflow-Zentrale für QCAD (2D) und FreeCAD (3D) – gebaut mit Tauri 2 + React + TypeScript.

## Schnellstart

```bash
cd apps/cad-hub
npm install
npm run tauri dev
```

**Voraussetzungen:** Node.js ≥ 22, Rust/Cargo ≥ 1.77, npm ≥ 10

## Struktur

```
company-cad/
├── apps/cad-hub/        # Tauri-Desktop-App (Hauptanwendung)
├── integrations/
│   ├── qcad/            # QCAD-Startparameter, DXF-Workflow
│   └── freecad/         # FreeCAD-Startparameter, STP-Workflow
├── docs/
│   ├── architecture/    # Entscheidungsprotokoll, Systemarchitektur, Repo-Analyse
│   ├── licensing/       # Lizenzrisiko-Analyse (GPLv3 / LGPL / MIT)
│   └── ux/              # UX-Prinzipien
├── config/
│   ├── config.example.json       # Konfigurationsvorlage
│   └── documents.example.json    # Dokument-Verzeichnis-Vorlage
└── test_projects/       # Beispiel-Projekte für manuelle Tests
```

## Was macht der Hub?

- **Projekte verwalten**: Erstellt die Ordnerstruktur `Projekt_<Nr>_<Name>/` mit 2D-, 3D-, Export- und Dokumentationsordnern
- **QCAD starten**: Öffnet QCAD mit dem Projekt-2D-Ordner (mit `-locale de`)
- **FreeCAD starten**: Öffnet FreeCAD mit dem Projekt-3D-Ordner
- **Dokumente öffnen**: Qualitätshandbuch und Arbeitsanweisungen direkt aus der App heraus
- **Logging**: Alle Aktionen werden in `~/companycad_logs/hub_log.jsonl` protokolliert

## Konfiguration

Beim ersten Start: **Einstellungen** öffnen und Pfade eintragen:

| Feld | Beispiel |
|------|---------|
| QCAD-Pfad | `/usr/bin/qcad` oder `C:\Program Files\QCAD\qcad.exe` |
| FreeCAD-Pfad | `/usr/bin/freecad` oder `C:\Program Files\FreeCAD\FreeCAD.exe` |
| Projektverzeichnis | `~/Projekte` |
| Qualitätshandbuch | `https://intern.firma.de/qm` oder `~/Dokumente/QM.pdf` |

Die Konfiguration wird unter `~/.config/companycad/config.json` gespeichert.

## Lizenz

CompanyCAD Hub: MIT  
QCAD: GPLv3 (wird nur als externer Prozess gestartet – kein Code-Merge)  
FreeCAD: LGPL 2.1+ (wird nur als externer Prozess gestartet – kein Code-Merge)
