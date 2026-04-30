# System-Architektur: CompanyCAD Hub

**Version:** 0.1.0 (MVP)  
**Stand:** 2026-04-27

---

## 1. Überblick

Der CompanyCAD Hub ist eine Desktop-Applikation (Tauri 2 + React), die als **Workflow-Zentrale** für 2D- und 3D-CAD-Aufgaben dient. QCAD und FreeCAD werden als **externe, unveränderte Programme** gestartet – der Hub verändert weder deren Quellcode noch ihre Konfiguration.

```
┌─────────────────────────────────────────────┐
│           CompanyCAD Hub (Tauri 2)          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │         React Frontend (Web-UI)       │  │
│  │                                       │  │
│  │  StartScreen  │  Projects  │  Docs    │  │
│  │  Settings     │  ErrorDlg  │  Status  │  │
│  └──────────────────────┬────────────────┘  │
│                         │ Tauri Commands     │
│  ┌──────────────────────▼────────────────┐  │
│  │         Rust Backend (Tauri)          │  │
│  │                                       │  │
│  │  launch_tool  │  write_log_entry      │  │
│  │  read_config  │  write_config         │  │
│  │  create_dir   │  write_file           │  │
│  │  read_file    │  check_path           │  │
│  └──────┬──────────────────┬─────────────┘  │
└─────────┼──────────────────┼───────────────┘
          │                  │
          ▼                  ▼
  ┌───────────────┐  ┌───────────────────┐
  │  Dateisystem  │  │  Externe Prozesse  │
  │               │  │                   │
  │  config.json  │  │  qcad datei.dxf   │
  │  project.json │  │  FreeCAD datei.   │
  │  hub_log.jsonl│  │  FCStd            │
  │  documents.   │  │                   │
  │  json         │  │  (fire-and-forget)│
  └───────────────┘  └───────────────────┘
```

---

## 2. Schichtenmodell

### Schicht 1: React Frontend

**Verantwortung:** Darstellung, Nutzerinteraktion, deutsche UI-Texte

```
src/
  components/
    StartScreen.tsx      ← Hauptoberfläche, 8 Aktions-Buttons
    StatusBar.tsx        ← App-Status, aktives Projekt, Fehlermeldungen
    ErrorDialog.tsx      ← Modale Fehlerdarstellung in Alltagssprache
  services/
    ConfigService.ts     ← Lädt/validiert config.json
    ProjectManager.ts    ← Projektstruktur erzeugen und verwalten
    ProcessLauncher.ts   ← openInQCAD(), openInFreeCAD()
    DocumentService.ts   ← Dokumente laden, suchen, öffnen
    LoggingService.ts    ← Aktionen in hub_log.jsonl schreiben
  config/
    defaults.ts          ← Standardwerte (kein leerer Zustand)
```

### Schicht 2: Tauri Commands (Rust)

**Verantwortung:** Systemzugriff, Prozessstart, Dateisystem

```
src-tauri/src/
  commands.rs            ← Alle Tauri-Commands (explizite Allowlist)
  lib.rs                 ← Command-Registrierung
  main.rs                ← Tauri-Einstiegspunkt
```

Registrierte Commands:
| Command | Eingabe | Ausgabe | Zweck |
|---------|---------|---------|-------|
| `launch_tool` | executable, file_path, args | LaunchResult | Externen Prozess starten |
| `read_config` | path | String (JSON) | config.json lesen |
| `write_config` | path, content | () | config.json schreiben |
| `write_log_entry` | path, entry | () | Zeile an hub_log.jsonl anhängen |
| `read_file` | path | String | Beliebige Textdatei lesen |
| `write_file` | path, content | () | Textdatei schreiben (+ Verzeichnis anlegen) |
| `create_directory` | path | () | Verzeichnis anlegen (inkl. Eltern) |
| `check_path` | path | bool | Prüfen ob Pfad existiert |

### Schicht 3: Dateisystem

**Verantwortung:** Persistenz aller Hub-Daten

| Datei | Inhalt | Ort |
|-------|--------|-----|
| `config.json` | App-Konfiguration | AppData (Betriebssystem-Standard) |
| `hub_log.jsonl` | Aktionsprotokoll (JSONL) | AppData |
| `documents.json` | Dokumentenindex | AppData oder konfigurierbarer Pfad |
| `Projekt_*/project.json` | Projektmetadaten | Konfigurierter Projektstamm |

---

## 3. Datenflüsse

### 3.1 App-Start

```
App startet
  → Tauri lädt index.html
  → React initialisiert (App.tsx)
  → ConfigService.loadConfig()
      → read_config(AppData/config.json)
      → Merge mit DEFAULT_CONFIG
      → validateConfig() → Warnungen sammeln
  → LoggingService.writeLog({ action: 'app_started' })
  → StartScreen wird angezeigt
  → StatusBar zeigt: "Bereit" oder Warnungen
```

### 3.2 Neues Projekt anlegen

```
Nutzer klickt "Neues Projekt"
  → Modal mit Eingabefeldern (Name, Kunde, Nummer)
  → ProjectManager.createProject(metadata, rootDir)
      → check_path(rootDir) → Fehler wenn nicht existiert
      → create_directory(Projekt_<Nr>_<Name>/01_2D_QCAD)
      → create_directory(.../02_3D_FreeCAD)
      → create_directory(.../03_Exports/PDF)
      → create_directory(.../03_Exports/DXF)
      → create_directory(.../03_Exports/STEP)
      → create_directory(.../04_Dokumentation)
      → create_directory(.../05_Arbeitsanweisungen)
      → write_file(.../project.json, metadata)
  → LoggingService.writeLog({ action: 'project_created', ... })
  → StatusBar: "Projekt angelegt: ..."
```

### 3.3 QCAD starten

```
Nutzer klickt "2D-Zeichnung bearbeiten"
  → ProcessLauncher.openInQCAD(projectPath, filePath)
      → ConfigService.loadConfig()
      → check_path(config.tools.qcad_executable)
          → false: { ok: false, message: "QCAD wurde nicht gefunden. Bitte prüfe den Programmpfad." }
      → check_path(filePath)
          → false: { ok: false, message: "Die DXF-Datei wurde nicht gefunden." }
      → launch_tool(executable, filePath, [])
          → std::process::Command::new(executable).arg(filePath).spawn()
          → Fehler → LaunchResult { ok: false, ... }
      → LoggingService.writeLog({ action: 'qcad_started', result: 'success'|'error' })
      → Rückgabe: LaunchResult
  → UI: StatusBar oder ErrorDialog
```

### 3.4 Log-Eintrag

```
Jede Hauptaktion:
  → LoggingService.writeLog({ action, project_id, input, result, warnings, errors })
      → timestamp = ISO 8601 (UTC)
      → JSON.stringify(entry) + '\n'
      → write_log_entry(AppData/hub_log.jsonl, zeile)
          → std::fs::OpenOptions::append(true).open(path).write(zeile)
```

---

## 4. Fehlerbehandlung

**Grundsatz:** Keine stillen Fehler. Jeder Fehler wird:
1. in `hub_log.jsonl` protokolliert
2. dem Nutzer in verständlichem Deutsch angezeigt

**Fehlermeldungs-Hierarchie:**
```
Rust-Fehler (technisch)
  → ProcessLauncher (übersetzt ins Deutsche)
  → LoggingService (protokolliert)
  → ErrorDialog oder StatusBar (angezeigt)
```

**Beispielübersetzungen:**
| Technischer Fehler | Deutsche Meldung |
|--------------------|------------------|
| `ENOENT: no such file` | "Die Datei wurde nicht gefunden. Bitte prüfe den Pfad." |
| `EACCES: permission denied` | "Zugriff verweigert. Bitte prüfe die Dateiberechtigungen." |
| `spawn ENOENT` | "QCAD wurde nicht gefunden. Bitte prüfe den Programmpfad in den Einstellungen." |

---

## 5. Projektstruktur (Dateisystem)

```
Projekt_<Nummer>_<Name>/
  01_2D_QCAD/          ← DXF, QCAD-Dateien
  02_3D_FreeCAD/       ← FCStd, STEP-Quelldateien
  03_Exports/
    PDF/               ← Exportierte PDFs
    DXF/               ← Exportierte DXF-Dateien
    STEP/              ← Exportierte STEP-Dateien
  04_Dokumentation/    ← Projektbezogene Dokumente
  05_Arbeitsanweisungen/ ← Aufgabenbezogene Anweisungen
  project.json         ← Projektmetadaten (maschinenlesbar)
```

---

## 6. MVP-Scope-Abgrenzung

### Im MVP enthalten
- ✅ Startscreen mit 8 deutschen Buttons
- ✅ Projektverwaltung (anlegen, öffnen, validieren)
- ✅ QCAD-Start via konfiguriertem Pfad
- ✅ FreeCAD-Start via konfiguriertem Pfad
- ✅ Dokumentenmodul (URL + lokale Dateien)
- ✅ Config-System mit Defaults und Validierung
- ✅ JSONL-Logging aller Hauptaktionen
- ✅ Deutsche Fehlermeldungen in Alltagssprache

### Nicht im MVP
- ❌ Direkte QCAD-API-Integration
- ❌ Direkte FreeCAD-Python-Anbindung
- ❌ DXF/STEP-Konvertierung
- ❌ Benutzerverwaltung / Mehrbenutzer
- ❌ Cloud-Anbindung
- ❌ Vollständige Web-CAD-Engine
