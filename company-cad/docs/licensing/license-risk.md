# Lizenzrisiko-Analyse: CompanyCAD Hub

**Erstellt:** 2026-04-27  
**Gültig für:** CompanyCAD Hub MVP v0.1.0

---

## Grundprinzip

Der CompanyCAD Hub startet QCAD und FreeCAD **ausschließlich als externe Betriebssystemprozesse**. Es wird kein Code aus diesen Projekten kopiert, verlinkt oder eingebettet. Dieses Prinzip ist das Fundament aller Lizenzentscheidungen in diesem Dokument.

---

## 1. QCAD-Lizenz

### Lizenz: GPLv3 mit optionalen Ausnahmen

**Relevante Dateien:**
- `/home/user/qcad_Scripting/LICENSE.txt`
- `/home/user/qcad_Scripting/gpl-3.0.txt`
- `/home/user/qcad_Scripting/gpl-3.0-exceptions.txt`

**Analyse:**

| Nutzungsart | Lizenzpflicht | Risiko |
|-------------|--------------|--------|
| QCAD als externer Prozess starten (`qcad file.dxf`) | Keine – rein externe Nutzung | ✅ Kein Risiko |
| QCAD-Quellcode kopieren | GPLv3-Pflicht: Quellcode offenlegen | ❌ Verboten im Hub |
| Gegen QCAD-Bibliotheken linken | GPLv3-Pflicht: gesamtes Programm unter GPLv3 | ❌ Nicht geplant |
| QCAD-Scripting-API nutzen (JS) | Nur wenn QCAD läuft; Ausnahme in `gpl-3.0-exceptions.txt` | ⚠️ Nicht im MVP |
| QCAD-C++-Plugin entwickeln | GPLv3 oder kommerzielle Lizenz nötig | ❌ Nicht im MVP |

**Entscheidung:** Kein QCAD-Code wird in den Hub eingebunden. QCAD wird nur als Prozess gestartet. **Kein Lizenzrisiko.**

**Pflicht:** Alle QCAD-Lizenzdateien (`LICENSE.txt`, `gpl-3.0.txt`, `gpl-3.0-exceptions.txt`, `cc-by-3.0.txt`, `lgpl.txt`) bleiben unverändert im Repository.

---

## 2. FreeCAD-Lizenz

### Lizenz: LGPL 2.1+

**Relevante Datei:**
- `/home/user/FreeCAD_STP_cleaning/LICENSE`

**Analyse:**

| Nutzungsart | Lizenzpflicht | Risiko |
|-------------|--------------|--------|
| FreeCAD als externer Prozess starten | Keine – rein externe Nutzung | ✅ Kein Risiko |
| FreeCAD-Quellcode kopieren | LGPL-Pflicht: Quellcode offenlegen | ❌ Verboten im Hub |
| Dynamisch gegen FreeCAD-Libs linken | LGPL erlaubt, aber komplex | ⚠️ Nicht im MVP |
| FreeCAD Python-API via `import FreeCAD` | Nur wenn FreeCAD im Python-Pfad; LGPL-kompatibel bei korrektem Linking | ⚠️ Nicht im MVP |
| FreeCAD-Workbench entwickeln | LGPL-kompatibel, aber FreeCAD muss installiert sein | ⚠️ Nicht im MVP |

**Entscheidung:** Kein FreeCAD-Code wird in den Hub eingebunden. FreeCAD wird nur als Prozess gestartet. **Kein Lizenzrisiko.**

**Pflicht:** Alle FreeCAD-Lizenzdateien (`LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`) bleiben unverändert.

---

## 3. Tauri 2

### Lizenz: MIT und Apache-2.0 (dual-lizenziert)

**Risiko:** Kein Risiko. MIT und Apache-2.0 sind vollständig permissiv. Kompatibel mit proprietärer Nutzung und GPLv3/LGPL-Projekten in getrennten Prozessen.

**Anforderungen:**
- MIT-Lizenztext von Tauri in der Applikation mitliefern (bei Distribution)
- Apache-2.0-Notice bei Verwendung der Apache-Lizenz-Variante

---

## 4. React

### Lizenz: MIT

**Risiko:** Kein Risiko. MIT ist vollständig permissiv.

**Anforderungen:**
- MIT-Lizenztext bei Distribution mitliefern

---

## 5. Weitere JavaScript-Abhängigkeiten

| Paket | Lizenz | Risiko |
|-------|--------|--------|
| `vite` | MIT | Kein Risiko |
| `vitest` | MIT | Kein Risiko |
| `@tauri-apps/api` | MIT | Kein Risiko |
| `@tauri-apps/plugin-shell` | MIT | Kein Risiko |
| `@vitejs/plugin-react` | MIT | Kein Risiko |
| `typescript` | Apache-2.0 | Kein Risiko |

---

## 6. Rust-Abhängigkeiten

| Crate | Lizenz | Risiko |
|-------|--------|--------|
| `tauri` | MIT / Apache-2.0 | Kein Risiko |
| `serde` | MIT / Apache-2.0 | Kein Risiko |
| `serde_json` | MIT / Apache-2.0 | Kein Risiko |
| `chrono` | MIT / Apache-2.0 | Kein Risiko |
| `dirs-next` | MIT / Apache-2.0 | Kein Risiko |

---

## 7. Icons und grafische Assets

**Risiko: Zu prüfen vor Distribution**

| Asset-Typ | Empfehlung |
|-----------|------------|
| Icons im Hub | Nur CC0, MIT oder selbst erstellte Icons verwenden |
| QCAD-Icons | Nicht übernehmen (CC-BY-3.0 erfordert Namensnennung) |
| FreeCAD-Icons | Nicht übernehmen ohne Lizenzprüfung |
| Firmenlogo | Nur Platzhalter (`assets/logo-placeholder.svg`) – kein fremdes Branding |

**Empfohlene Icon-Quellen (CC0 / MIT):**
- Heroicons (MIT)
- Tabler Icons (MIT)
- Lucide Icons (ISC)

---

## 8. Firmenlogo und Branding

**Regel:** Der Hub enthält ausschließlich `assets/logo-placeholder.svg` (eigene geometrische Form, kein Markenschutz). Das tatsächliche Firmenlogo muss vom Unternehmen bereitgestellt werden und darf keine Drittpartei-Markenzeichen enthalten.

---

## 9. Verteilung (Distribution)

Falls der CompanyCAD Hub extern verteilt wird (außerhalb der eigenen Organisation):

1. Hub-eigene Lizenzdatei (MIT empfohlen) zu `company-cad/apps/cad-hub/LICENSE` hinzufügen
2. `npm run license-report` oder `cargo license` ausführen, um alle Abhängigkeiten zu listen
3. QCAD und FreeCAD separat installieren lassen – niemals in das Hub-Bundle einschließen
4. Einen Hinweis in der App anzeigen: "QCAD und FreeCAD sind separate Programme und müssen separat lizenziert und installiert werden."

---

## 10. Zusammenfassung

| Komponente | Lizenz | Risiko | Maßnahme |
|------------|--------|--------|----------|
| QCAD | GPLv3 + Ausnahmen | **Kein Risiko** | Nur externer Prozessstart; Lizenzdateien unberührt |
| FreeCAD | LGPL 2.1+ | **Kein Risiko** | Nur externer Prozessstart; Lizenzdateien unberührt |
| Tauri 2 | MIT / Apache-2.0 | **Kein Risiko** | Lizenz-Notice bei Distribution |
| React | MIT | **Kein Risiko** | Lizenz-Notice bei Distribution |
| Andere npm/Cargo | MIT / Apache-2.0 | **Kein Risiko** | Standard permissiv |
| Icons (geplant) | Zu prüfen | **Potentielles Risiko** | Nur CC0/MIT-Icons verwenden |
| Firmenlogo | Intern | **Kein Risiko** | Nur Platzhalter im MVP |
