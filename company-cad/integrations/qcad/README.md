# QCAD-Integration: CompanyCAD Hub

Dieses Verzeichnis enthält Dokumentation und Integrationsdateien für die QCAD-Anbindung im CompanyCAD Hub.

## Integrationsstrategie

Der CompanyCAD Hub integriert QCAD **ausschließlich als externen Prozess**.  
Es wird kein QCAD-Quellcode kopiert, verlinkt oder verändert.

## Inhalt

| Datei | Beschreibung |
|-------|-------------|
| `launch-notes.md` | QCAD-CLI-Argumente und Startparameter |

## QCAD-Lizenz

QCAD steht unter GPLv3. Alle Lizenzdateien im QCAD-Repository bleiben unverändert.  
Siehe `docs/licensing/license-risk.md` für die vollständige Lizenzanalyse.

## Voraussetzungen

- QCAD muss separat installiert sein
- Pfad in `config.json → tools.qcad_executable` eintragen
- Unterstützte Dateiformate: `.dxf`, `.qcad`
