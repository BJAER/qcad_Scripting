# Repository-Audit: CompanyCAD Hub

**Erstellt:** 2026-04-27  
**Zweck:** Analyse der vorhandenen Repositories als Grundlage für den CompanyCAD Hub MVP

---

## 1. Erkannte Repositories

### QCAD (`bjaer/qcad_scripting`)

| Merkmal | Wert |
|---------|------|
| Lokaler Pfad | `/home/user/qcad_Scripting/` |
| Hauptsprache | C++ (Qt 5/6) |
| Buildsystem | CMake 3.16+ (primär), Qt qmake (sekundär) |
| Lizenz | GPLv3 mit optionalen Ausnahmen |
| Nebenlizenzen | CC-BY-3.0 (Icons/Doku), LGPL (Drittbibliotheken) |
| Scripting-API | ECMAScript / JavaScript (Qt Script Engine) |
| Plugin-System | C++-Plugins via Qt Plugin-Interface (.so/.dll) |
| Einstiegspunkte | `src/run/`, `scripts/autostart.js` |

### FreeCAD (`bjaer/freecad_stp_cleaning`)

| Merkmal | Wert |
|---------|------|
| Lokaler Pfad | `/home/user/FreeCAD_STP_cleaning/` |
| Hauptsprache | C++ mit Python-Scripting |
| Buildsystem | CMake 3.22+, Ninja, Pixi (conda-basiert) |
| Lizenz | LGPL 2.1+ |
| Python-Version | 3.11–3.12 |
| GUI-Framework | Qt 6.8 mit PySide6 |
| 3D-Kernel | OpenCASCADE |
| Einstiegspunkte | `FreeCAD` (GUI), `FreeCADCmd` (Konsole/headless) |

---

## 2. Hauptsprachen und Buildumgebung

**QCAD:**
- C++17 mit Qt 5/6
- Build via `cmake -DBUILD_QT6=ON .` + `make`
- Scripting via ECMAScript/JavaScript (100+ auto-generierte API-Bindings in `src/scripting/ecmaapi/`)
- Add-on-System: Verzeichnisbasierte JS-Module, auto-load via `autostart.js`

**FreeCAD:**
- C++17 mit OpenCASCADE-Geometriekern
- Python-Bindings via PyBind11 (SWIG wird schrittweise abgelöst)
- Build via Pixi: `pixi run configure && pixi run build`
- 34 Workbench-Module mit `Init.py` und `InitGui.py`

---

## 3. Relevante Einstiegspunkte

### QCAD – externer Start
```bash
# Datei öffnen:
qcad /pfad/zur/datei.dxf

# Kommandozeilen-Optionen (aus qcad.1):
# -style <style>       Qt-Stil
# -no-gui              Headless-Modus (eingeschränkt)
# <datei.dxf>          Datei direkt öffnen
```

### FreeCAD – externer Start
```bash
# GUI mit Datei öffnen:
FreeCAD /pfad/zur/datei.FCStd

# Headless Python-Skript:
FreeCADCmd /pfad/zum/skript.py

# Debug-Build (Pixi):
pixi run freecad-debug /pfad/zur/datei.FCStd
```

---

## 4. Mögliche Integrationspunkte

### QCAD
| Integrationspunkt | Typ | Bewertung |
|-------------------|-----|-----------|
| Prozessstart mit Dateiargument | Externer Prozess | ✅ Einfach, kein Lizenzrisiko |
| ECMAScript-Scripting-API | Direktintegration | ⚠️ Nur sinnvoll wenn QCAD bereits läuft |
| C++-Plugin-Interface | Direktintegration | ⚠️ GPLv3-Lizenzpflicht bei Verteilung |
| Add-on (JS-Modul) | Direktintegration | ⚠️ Erfordert Zugang zum laufenden QCAD |

### FreeCAD
| Integrationspunkt | Typ | Bewertung |
|-------------------|-----|-----------|
| Prozessstart mit Dateiargument | Externer Prozess | ✅ Einfach, kein Lizenzrisiko |
| `FreeCADCmd` + Python-Skript | Externer Prozess | ✅ Für Batch-Verarbeitung geeignet |
| Python-Modul `import FreeCAD` | Direktintegration | ⚠️ Erfordert FreeCAD in Python-Pfad |
| Workbench-Modul | Direktintegration | ⚠️ LGPL-kompatibel, aber komplex |

---

## 5. Risiken bei direkter Codeänderung

### QCAD (GPLv3)
- **Risiko:** Jede Änderung am QCAD-Kern, die verteilt wird, muss unter GPLv3 offengelegt werden.
- **Risiko:** Kompiliertes Linken gegen QCAD-Bibliotheken kann GPLv3-Pflichten auslösen.
- **Empfehlung:** QCAD nur als externen Prozess starten. Kein Codekopieren, kein Linken.

### FreeCAD (LGPL 2.1+)
- **Risiko:** LGPL erlaubt proprietäre Nutzung bei dynamischem Linken – jedoch komplex.
- **Empfehlung:** FreeCAD nur als externen Prozess starten. Einfacher und risikofrei.

---

## 6. Empfehlung für MVP-Struktur

**Strategie:** Variante A (Launcher/Workflow-Zentrale) + Variante E (moderne Web-Optik)

**Kern-Entscheidung:** QCAD und FreeCAD werden **ausschließlich als externe Prozesse** gestartet.  
Kein Codevermischen, keine Bibliotheksverlinkung, keine Plugin-Entwicklung im MVP.

**Tech-Stack:** Tauri 2 + React + TypeScript + Vite  
- Tauri: MIT/Apache-2.0, kein Lizenzkonflikt
- Rust-Backend für sichere Prozesssteuerung
- React-Frontend für moderne Web-Optik
- Node.js v22 + Rust/Cargo 1.94.1 im Workspace verfügbar

**Neue Verzeichnisstruktur** (außerhalb der QCAD/FreeCAD-Quellbäume):
```
company-cad/
  apps/cad-hub/        ← Tauri + React Desktop-App
  integrations/qcad/   ← QCAD-Integrationsdokumentation
  integrations/freecad/ ← FreeCAD-Integrationsdokumentation
  docs/                ← Architektur, Lizenz, UX
  config/              ← Konfigurationsvorlagen
  test_projects/       ← Beispielprojekte
```

---

## 7. Fazit

| Kriterium | Bewertung |
|-----------|-----------|
| MVP-Umsetzbarkeit | ✅ Hoch – Prozessstart-Integration ist einfach |
| Lizenzrisiko | ✅ Gering – kein direktes Linken oder Codevermischen |
| Benutzerfreundlichkeit | ✅ Hoch – Hub abstrahiert CAD-Komplexität |
| Wartbarkeit | ✅ Hoch – Hub und CAD-Tools unabhängig aktualisierbar |
| Technische Schulden | ✅ Gering – saubere Trennung von Anfang an |
