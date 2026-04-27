# QCAD – Startparameter und CLI-Referenz

## Grundlegende Syntax

```bash
qcad [optionen] [datei]
```

## Relevante Parameter für CompanyCAD Hub

| Parameter | Beschreibung |
|-----------|-------------|
| `qcad datei.dxf` | Öffnet die DXF-Datei direkt beim Start |
| `-locale de` | Setzt die Sprache auf Deutsch |
| `-config /pfad/config` | Verwendet eine andere Konfigurationsdatei |
| `-allow-multiple-instances` | Erlaubt mehrere QCAD-Instanzen gleichzeitig |
| `-no-gui` | Headless-Modus (eingeschränkt, für Batch-Scripting) |
| `-exec skript.js` | Führt ein ECMAScript-Skript nach dem Start aus |
| `-quit` | Beendet QCAD nach Ausführung (mit `-exec`) |
| `-style fusion` | Setzt den Qt-Stil (z. B. für Firmenbranding) |

## Empfohlener Start-Befehl im Hub

```
{qcad_executable} -locale de {absoluter_dateipfad}
```

Beispiel:
```bash
/usr/bin/qcad -locale de /home/nutzer/Projekte/Projekt_001/01_2D_QCAD/zeichnung.dxf
```

Windows-Beispiel:
```
"C:\Program Files\QCAD\qcad.exe" -locale de "C:\Projekte\Projekt_001\01_2D_QCAD\zeichnung.dxf"
```

## Unterstützte Dateiformate

| Format | Beschreibung |
|--------|-------------|
| `.dxf` | Drawing Exchange Format (AutoCAD) |
| `.dwg` | AutoCAD Drawing (nur mit QCAD Professional) |

## Desktop-Integration

Die Datei `qcad.desktop` im QCAD-Repository definiert:
```
Exec=qcad %F
MimeType=application/dxf;image/vnd.dxf
```

Der `%F`-Platzhalter wird bei Desktop-Dateiverknüpfungen durch den Dateipfad ersetzt.

## Programmstandorte

| Betriebssystem | Typischer Pfad |
|----------------|----------------|
| Linux | `/usr/bin/qcad` oder `/opt/qcad/qcad` |
| Windows | `C:\Program Files\QCAD\qcad.exe` |
| macOS | `/Applications/QCAD.app/Contents/MacOS/QCAD` |

## Headless-Nutzung (zukünftig)

Für Batch-Export (nicht im MVP):
```bash
qcad -no-gui -exec export_pdf.js -quit datei.dxf
```

Das Skript `export_pdf.js` müsste als ECMAScript-Add-on implementiert werden.

## Bekannte Einschränkungen

- QCAD GPLv3: Kein Code darf in den Hub kopiert oder gelinkt werden
- `-no-gui` (headless) ist eingeschränkt – nicht alle Funktionen verfügbar
- `-locale de` erfordert die deutsche Sprachdatei im QCAD-Verzeichnis
