# FreeCAD-Integration: CompanyCAD Hub

Dieses Verzeichnis enthält Dokumentation und Integrationsdateien für die FreeCAD-Anbindung im CompanyCAD Hub.

## Integrationsstrategie

Der CompanyCAD Hub integriert FreeCAD **ausschließlich als externen Prozess**.  
Es wird kein FreeCAD-Quellcode kopiert, verlinkt oder verändert.

## Inhalt

| Datei | Beschreibung |
|-------|-------------|
| `launch-notes.md` | FreeCAD-CLI-Argumente und Startparameter |

## FreeCAD-Lizenz

FreeCAD steht unter LGPL 2.1+. Alle Lizenzdateien im FreeCAD-Repository bleiben unverändert.  
Siehe `docs/licensing/license-risk.md` für die vollständige Lizenzanalyse.

## Voraussetzungen

- FreeCAD muss separat installiert sein
- Pfad in `config.json → tools.freecad_executable` eintragen
- Unterstützte Dateiformate: `.FCStd`, `.step`, `.stp`, `.iges`, `.brep`, `.stl`
