# CompanyCAD Hub

Eine moderne Desktop-App (Tauri 2 + React) als Workflow-Zentrale für QCAD und FreeCAD.

## Voraussetzungen

| Werkzeug | Mindestversion | Zweck |
|----------|---------------|-------|
| Node.js | 20.x | Frontend-Build |
| npm | 9.x | Paketverwaltung |
| Rust | 1.77+ | Tauri-Backend |
| Cargo | (mit Rust) | Rust-Paketverwaltung |

Optionale Installationsempfehlung: [rustup.rs](https://rustup.rs) für Rust.

## Einrichtung

```bash
# Im Verzeichnis company-cad/apps/cad-hub/
npm install
```

## Entwicklung

```bash
# Frontend + Tauri zusammen (Hot-Reload):
npm run tauri dev

# Nur Frontend (ohne Tauri, für Service-Tests):
npm run dev
```

## Build

```bash
# Produktiv-Build (erzeugt dist/ und Tauri-Installer):
npm run tauri build

# Nur Frontend-Build:
npm run build

# Rust-Prüfung (ohne vollständiges Linken):
cd src-tauri && cargo check
```

## Tests

```bash
# Alle Unit-Tests ausführen:
npm test

# Tests im Watch-Modus:
npm run test:watch

# Mit Coverage-Report:
npm run test -- --coverage
```

## Konfiguration

Beim ersten Start erstellt der Hub eine Standardkonfiguration.  
Konfigurationsdatei: `~/.config/companycad/config.json`

Vorlage: `../../config/config.example.json`

**Wichtig:** Nach der Installation müssen die Pfade zu QCAD und FreeCAD eingetragen werden:
```json
{
  "tools": {
    "qcad_executable": "/usr/bin/qcad",
    "freecad_executable": "/usr/bin/freecad"
  }
}
```

## Projektstruktur

```
cad-hub/
  src/
    components/     ← React-Komponenten (StartScreen, StatusBar, ErrorDialog)
    services/       ← Businesslogik (Config, Project, Launcher, Documents, Logging)
    config/         ← Standardwerte
    assets/         ← Statische Assets (Logo-Platzhalter, etc.)
    __tests__/      ← Unit-Tests (Vitest)
  src-tauri/
    src/
      commands.rs   ← Tauri-Commands (Prozessstart, Dateizugriff, Logging)
      lib.rs        ← Command-Registrierung
      main.rs       ← App-Einstiegspunkt
    tauri.conf.json ← Tauri-Konfiguration (Fenster, Berechtigungen)
    Cargo.toml      ← Rust-Abhängigkeiten
```

## Technologie-Stack

- **Frontend:** React 18, TypeScript 5, Vite 5
- **Backend:** Rust (Tauri 2)
- **Tests:** Vitest 2, Testing Library
- **Lizenz:** MIT

## Lizenz

MIT – Dieser Code ist unabhängig von QCAD (GPLv3) und FreeCAD (LGPL 2.1+) lizenziert.  
QCAD und FreeCAD werden nur als externe Programme gestartet.

Siehe `../../docs/licensing/license-risk.md` für Details.
