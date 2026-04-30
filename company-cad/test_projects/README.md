# Testprojekte

Dieses Verzeichnis enthält Beispielprojekte für manuelle Tests und CI-Verifikation.

## Zweck

- Manuelle Überprüfung der Projektstruktur
- Verifizierung der `createProject()`-Funktion
- Grundlage für automatisierte End-to-End-Tests

## Projektstruktur

Jedes Testprojekt folgt der Standardstruktur:

```
Projekt_<Nummer>_<Name>/
  01_2D_QCAD/                  ← DXF- und QCAD-Zeichnungsdateien
  02_3D_FreeCAD/               ← FCStd- und STEP-Quelldateien
  03_Exports/
    PDF/                       ← Exportierte PDF-Zeichnungen
    DXF/                       ← Exportierte DXF-Dateien
    STEP/                      ← Exportierte STEP-Dateien
  04_Dokumentation/            ← Projektbezogene Dokumente
  05_Arbeitsanweisungen/       ← Aufgabenbezogene Anweisungen
  project.json                 ← Projektmetadaten
```

## project.json-Schema

```json
{
  "project_id": "2024-001",
  "project_name": "Beispielprojekt",
  "customer": "Musterfirma GmbH",
  "created_at": "2024-01-01T10:00:00.000Z",
  "created_by": "Max Mustermann",
  "description": "Optionale Projektbeschreibung",
  "paths": {
    "qcad_2d": "01_2D_QCAD",
    "freecad_3d": "02_3D_FreeCAD",
    "exports": "03_Exports",
    "documentation": "04_Dokumentation"
  },
  "documents": {
    "quality_manual": "",
    "work_instructions": []
  }
}
```

## Verwendung in Tests

Die Testprojekte können direkt von `ProjectManager.test.ts` referenziert werden:

```typescript
const testProjectPath = path.join(__dirname, '../../test_projects/Projekt_001_Beispiel');
const result = await validateProject(testProjectPath);
expect(result.valid).toBe(true);
```

## Hinweis

Testprojekte enthalten keine echten CAD-Dateien.  
Für CAD-Funktionen (QCAD-Start, FreeCAD-Start) werden die Prozessstarter in Tests gemockt.
