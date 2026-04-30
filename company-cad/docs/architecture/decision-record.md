# ADR-001: Tech-Stack-Entscheidung – Tauri + React vs. Electron

**Status:** Entschieden  
**Datum:** 2026-04-27  
**Kontext:** CompanyCAD Hub MVP

---

## Kontext und Problem

Für den CompanyCAD Hub wird eine Desktop-App benötigt, die:
- eine moderne, webbasierte Oberfläche bietet
- externe Prozesse (QCAD, FreeCAD) starten und überwachen kann
- auf Dateisystem zugreifen kann (Projektordner, Config, Log)
- für Windows primär, Linux/macOS sekundär deploybar ist
- möglichst keine Lizenzprobleme mit QCAD (GPLv3) und FreeCAD (LGPL 2.1+) erzeugt

---

## Betrachtete Optionen

### Option 1: Tauri 2 + React + TypeScript + Vite ✅ (gewählt)

**Vorteile:**
- **Lizenz:** MIT / Apache-2.0 – kein Konflikt mit GPLv3 oder LGPL
- **Bundle-Größe:** ~10–15 MB (nutzt System-WebView, kein gebündeltes Chromium)
- **Sicherheit:** Rust-Backend mit explizitem Allowlist-System für Tauri-Commands
- **Prozesssteuerung:** `std::process::Command` in Rust – robust und sicher
- **Windows-Deployment:** NSIS/MSI-Installer out-of-the-box via `cargo tauri build`
- **Performance:** Rust-Backend ist schnell und speichereffizient
- **Toolchain:** Rust/Cargo 1.94.1 + Node.js 22 im Workspace verfügbar

**Nachteile:**
- Rust erforderlich (Lernkurve für zukünftige Contributor)
- System-WebView-Abhängigkeit (Edge auf Windows, WebKitGTK auf Linux)
- Kleinere Community als Electron

---

### Option 2: Electron + React + TypeScript

**Vorteile:**
- Sehr große Community, viele Beispiele
- Node.js child_process für externe Prozesse bekannt
- WebView ist immer Chromium (konsistentes Verhalten)

**Nachteile:**
- **Bundle-Größe:** ~150–300 MB (Chromium gebündelt)
- **Lizenz:** MIT – kein direkter Konflikt, aber größere App erfordert mehr Aufwand bei Distribution
- **Ressourcenverbrauch:** Deutlich höher (RAM, CPU) als Tauri
- **Sicherheit:** Node.js in Renderer-Prozess ohne strikte Trennung anfälliger
- **Performance:** Langsamer Start, höherer Speicherverbrauch

---

## Entscheidung

**Tauri 2 + React + TypeScript + Vite** wird für den CompanyCAD Hub MVP eingesetzt.

### Begründung

1. **Lizenz-Sicherheit:** Tauri (MIT/Apache-2.0) passt ohne Einschränkungen zur Kombination mit QCAD (GPLv3) und FreeCAD (LGPL 2.1+) – solange kein Code der CAD-Tools in die Tauri-App eingebunden wird. Electron ist ebenfalls MIT, aber die höhere Komplexität schafft mehr potenzielle Risikofelder.

2. **Schlankes Deployment:** In einem Firmenumfeld ist eine kleine, schnelle App wichtiger als maximale Browser-Kompatibilität. Die ~10 MB Tauri-App vs. ~200 MB Electron-App ist ein erheblicher praktischer Vorteil.

3. **Sicherheitsarchitektur:** Tauri's Command-System erzwingt eine explizite Allowlist für alle Backend-Operationen. Das passt zum Sicherheitsbedarf (keine unkontrollierten Prozessstarts aus dem Frontend).

4. **Toolchain verfügbar:** Node.js v22 und Rust/Cargo 1.94.1 sind in der Entwicklungsumgebung bereits vorhanden.

---

## Konsequenzen

### Positiv
- Kleinste mögliche App für Windows-Deployment
- Strikte Sicherheitsgrenzen zwischen Frontend und Backend
- Kein Lizenzrisiko durch Tech-Stack-Wahl

### Negativ / Risiken
- Rust-Kenntnisse erforderlich für Backend-Erweiterungen
- `src-tauri/src/commands.rs` ist kritischer Punkt – Änderungen dort erfordern Rust-Verständnis
- System-WebView muss auf Zielrechnern ausreichend aktuell sein (Windows 10 1903+ hat WebView2)

### Migrationspfad
Falls Tauri in Zukunft nicht mehr tragbar ist, kann das React-Frontend nahezu unverändert nach Electron migriert werden. Die Services-Schicht abstrahiert alle Tauri-Aufrufe hinter TypeScript-Interfaces.

---

## Relevante Versionen

| Komponente | Version |
|------------|---------|
| Tauri | 2.x |
| React | 18.x |
| TypeScript | 5.x |
| Vite | 5.x |
| Vitest | 2.x (Tests) |
| Rust | 1.94.1 |
| Node.js | 22.x |
