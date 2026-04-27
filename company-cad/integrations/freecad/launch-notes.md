# FreeCAD – Startparameter und CLI-Referenz

## Grundlegende Syntax

```bash
FreeCAD [datei]
FreeCADCmd [optionen] [datei_oder_skript]
```

## Relevante Parameter für CompanyCAD Hub

| Parameter | Beschreibung |
|-----------|-------------|
| `FreeCAD datei.FCStd` | Öffnet die FCStd-Datei direkt beim Start |
| `FreeCAD datei.step` | Öffnet eine STEP-Datei im Part-Workbench |
| `FreeCAD --console` | Headless-Konsolenmodus (ohne GUI) |
| `FreeCAD -t skript.py` | Führt Python-Test-Skript aus (Konsolen-Modus) |
| `FreeCADCmd skript.py` | Headless Python-Skriptausführung |

## Empfohlener Start-Befehl im Hub

```
{freecad_executable} {absoluter_dateipfad}
```

Beispiel (Linux):
```bash
/usr/bin/freecad /home/nutzer/Projekte/Projekt_001/02_3D_FreeCAD/modell.FCStd
```

Beispiel (Windows):
```
"C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe" "C:\Projekte\Projekt_001\02_3D_FreeCAD\modell.FCStd"
```

## Programmstandorte

| Betriebssystem | Typischer Pfad |
|----------------|----------------|
| Linux (Paketmanager) | `/usr/bin/freecad` oder `/usr/local/bin/freecad` |
| Linux (AppImage) | `FreeCAD-*.AppImage` |
| Linux (Pixi-Build, debug) | `build/debug/bin/FreeCAD` |
| Linux (Pixi-Build, release) | `build/release/bin/FreeCAD` |
| Windows (installiert) | `C:\Program Files\FreeCAD 0.21\bin\FreeCAD.exe` |
| macOS | `/Applications/FreeCAD.app/Contents/MacOS/FreeCAD` |

**Wichtig für macOS:** Die ausführbare Datei ist `FreeCAD.app/Contents/MacOS/FreeCAD`, NICHT `FreeCAD.app` direkt.

## Unterstützte Dateiformate

| Format | Beschreibung |
|--------|-------------|
| `.FCStd` | FreeCAD natives Format (komprimiertes XML) |
| `.step`, `.stp` | STEP (ISO 10303) – Standardaustauschformat für 3D |
| `.iges`, `.igs` | IGES – Älteres 3D-Austauschformat |
| `.brep` | OpenCASCADE BREP-Format |
| `.stl` | STL – 3D-Druckformat |
| `.obj` | Wavefront OBJ |

## Headless-Nutzung (zukünftig, nicht im MVP)

Für Batch-Verarbeitung via Python-Skript:
```bash
FreeCADCmd /pfad/zum/skript.py
```

Für STP-Bereinigung (relevant für freecad_stp_cleaning):
```python
import FreeCAD
import Import
doc = FreeCAD.newDocument()
Import.open("/pfad/zur/datei.stp")
FreeCAD.closeDocument(doc.Name)
```

## Bekannte Einschränkungen

- FreeCAD LGPL 2.1+: Kein Code darf in den Hub kopiert oder gelinkt werden
- `FreeCAD --console` hat keinen vollständigen GUI-Funktionsumfang
- Auf Windows muss der vollständige Pfad zur `.exe` konfiguriert werden (kein `freecad` im PATH per Standard)
- FreeCAD benötigt beim Start ggf. 5–15 Sekunden – Hub sollte Statusmeldung anzeigen
