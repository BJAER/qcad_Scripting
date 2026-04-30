# UX-Prinzipien: CompanyCAD Hub

**Version:** 0.1.0  
**Zielgruppe:** Nicht-technische CAD-Anwender im Firmeneinsatz

---

## 1. Leitgedanke

Der Hub soll sich anfühlen wie:

> „Ich öffne unser Firmen-CAD-Programm, wähle meine Aufgabe und werde sauber geführt."

Nicht wie:
> „Ich öffne QCAD plus FreeCAD plus viele Menüs."

**Benutzerfreundlichkeit hat Vorrang vor Feature-Menge.**

---

## 2. Sprachregeln

### 2.1 Sprache
- Gesamte Oberfläche auf **Deutsch**
- Keine englischen Fachbegriffe, wenn ein verständliches deutsches Wort existiert
- Ausnahmen: Produktnamen (QCAD, FreeCAD, DXF, STEP) dürfen englisch bleiben

### 2.2 Buttontexte

| Gut ✅ | Schlecht ❌ |
|--------|------------|
| Neues Projekt | Create New Project |
| Projekt öffnen | Open Project Context |
| 2D-Zeichnung bearbeiten | Execute QCAD Process |
| 3D-Modell bearbeiten | Init FreeCAD Workbench |
| Qualitätshandbuch | Load QM Document Entity |
| Arbeitsanweisungen | Run CAD Shell Instructions |
| Einstellungen | Configure System Parameters |
| Abbrechen | Cancel Operation |

### 2.3 Fehlermeldungen

Fehlermeldungen müssen:
1. **Auf Deutsch** formuliert sein
2. Das **Problem** beschreiben (Was ist passiert?)
3. Eine **Lösung** vorschlagen (Was soll der Nutzer tun?)

| Technischer Fehler | Gute Fehlermeldung |
|--------------------|-------------------|
| `ENOENT: no such file or directory` | "Die Datei wurde nicht gefunden. Bitte prüfe den Dateipfad." |
| `spawn ENOENT` | "QCAD wurde nicht gefunden. Bitte prüfe den Programmpfad in den Einstellungen." |
| `EACCES: permission denied` | "Zugriff verweigert. Bitte prüfe die Dateiberechtigungen." |
| `JSON SyntaxError` | "Die Konfigurationsdatei ist beschädigt. Bitte prüfe config.json." |
| Netzwerkfehler bei URL | "Das Dokument konnte nicht geöffnet werden. Bitte prüfe die Internetverbindung oder die URL in den Einstellungen." |

**Niemals:**
- Rohe Systemmeldungen anzeigen (`ENOENT spawn qcad.exe: no such file or directory`)
- Leere Fehlerdialoge
- Fehlermeldungen ohne Lösungsvorschlag

---

## 3. Startscreen-Layout

### 3.1 Grundprinzip
- **Maximal 8 Hauptbuttons** auf dem Startscreen
- Keine versteckten Menüs für Kernfunktionen
- Alle wichtigen Aktionen auf einem Blick sichtbar

### 3.2 Button-Reihenfolge (Priorität)

```
┌────────────────────────────────────────────────────────┐
│  [LOGO]  CompanyCAD Hub                    [Status]    │
├────────────────┬───────────────────────────────────────┤
│                │                                       │
│  Neues Projekt │  Projekt öffnen                       │
│                │                                       │
│  2D-Zeichnung  │  3D-Modell                            │
│  bearbeiten    │  bearbeiten                           │
│                │                                       │
│  Qualitäts-    │  Arbeits-                             │
│  handbuch      │  anweisungen                          │
│                │                                       │
│  Einstellungen │  App-Info / Über                      │
│                │                                       │
├────────────────┴───────────────────────────────────────┤
│  Statusleiste                                          │
└────────────────────────────────────────────────────────┘
```

### 3.3 Button-Gestaltung
- **Große Klickfläche:** Mindestgröße 120×80 px
- **Klares Icon** + Text-Label darunter
- **Hover-Effekt:** Deutliche visuelle Rückmeldung
- **Fokus-Indikator:** Sichtbarer Rahmen bei Tastaturnavigation
- **Deaktivierter Zustand:** Grau + Tooltip mit Erklärung (z. B. "QCAD nicht konfiguriert")

---

## 4. Firmenbranding

### 4.1 Logo
- Position: Oben links oder oben zentral
- Platzhalter: `assets/logo-placeholder.svg` (geometrisch, neutral)
- Konfigurierbar über `config.json → branding.logo_path`

### 4.2 Farben
| Rolle | Standardfarbe | Konfigurierbar |
|-------|--------------|----------------|
| Primärfarbe (Hintergrund, Header) | `#1f2937` (dunkelblau-grau) | Ja |
| Akzentfarbe (Buttons, Links) | `#2563eb` (blau) | Ja |
| Text (hell) | `#f9fafb` | Nein |
| Text (dunkel) | `#111827` | Nein |
| Fehlerfarbe | `#dc2626` (rot) | Nein |
| Warnfarbe | `#d97706` (orange) | Nein |
| Erfolgsfarbe | `#16a34a` (grün) | Nein |

### 4.3 Typografie
- Schriftart: System-Schriftart (keine externe Schrift notwendig)
- Schriftgröße: Mindestens 14px für alle Texte
- Zeilenhöhe: 1.5 für Lesbarkeit

---

## 5. Statusleiste

Die Statusleiste am unteren Rand zeigt immer:
- **Aktuelles Projekt** (falls eines geöffnet ist)
- **Letzte Aktion** ("QCAD gestartet", "Projekt angelegt", etc.)
- **Warnungen** (z. B. "QCAD-Pfad nicht konfiguriert")
- **Fehler** (mit roter Markierung)

Die Statusleiste wird **niemals** leer angezeigt.  
Standardtext wenn nichts aktiv: "Bereit."

---

## 6. Barrierefreiheit

- Alle Buttons haben `aria-label`-Attribute
- Tastaturnavigation: Tab / Enter / Escape funktionieren ohne Maus
- Farbkontrast: WCAG AA-Konformität (4.5:1 für Normal-Text)
- Keine rein farbbasierten Rückmeldungen (Icon oder Text immer ergänzend)

---

## 7. Ladezeiten und Rückmeldungen

| Aktion | Erwartete Dauer | Rückmeldung |
|--------|----------------|-------------|
| App starten | < 2 Sek. | Sofort Startscreen |
| QCAD starten | 2–10 Sek. | Statusleiste: "QCAD wird gestartet..." |
| FreeCAD starten | 5–15 Sek. | Statusleiste: "FreeCAD wird gestartet..." |
| Projekt anlegen | < 1 Sek. | Statusleiste: "Projekt angelegt: ..." |
| Dokument öffnen | < 2 Sek. | Browser/PDF öffnet sich |

**Regel:** Kein Prozess läuft unsichtbar. Jede Aktion hat eine Statusmeldung.

---

## 8. Was wir bewusst NICHT tun

- Keine komplexen CAD-Menüs in der Hub-Oberfläche
- Keine technischen Dateipfade in der Hauptansicht anzeigen
- Kein Überladen der Startseite mit mehr als 8 Buttons
- Keine mehrstufigen Untermenüs für Kernfunktionen
- Keine leeren Zustände ohne Erklärung
- Keine automatischen Aktionen ohne Nutzerbestätigung (außer Log-Schreiben)
