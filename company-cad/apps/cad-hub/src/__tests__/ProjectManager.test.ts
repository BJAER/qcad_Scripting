import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProject, openProject, validateProject } from "../services/ProjectManager";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("../services/ConfigService", () => ({
  loadConfig: vi.fn(),
}));

vi.mock("../services/LoggingService", () => ({
  writeLog: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { loadConfig } from "../services/ConfigService";
const mockInvoke = vi.mocked(invoke);
const mockLoadConfig = vi.mocked(loadConfig);

const FULL_CONFIG = {
  app: { name: "CompanyCAD Hub", version: "0.1.0", language: "de-DE" },
  branding: { logo_path: "", primary_color: "#1f2937", accent_color: "#2563eb" },
  tools: { qcad_executable: "/usr/bin/qcad", freecad_executable: "/usr/bin/freecad" },
  documents: { quality_manual_url: "", work_instruction_base_url: "" },
  projects: { default_root: "/home/user/Projekte" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadConfig.mockResolvedValue(FULL_CONFIG);
});

describe("createProject", () => {
  it("erzeugt korrekten Verzeichnisnamen Projekt_<Nr>_<Name>", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const result = await createProject({
      project_number: "2024-001",
      project_name: "Gehäuse Typ A",
      customer: "Musterfirma GmbH",
    });
    expect(result.ok).toBe(true);
    expect(result.project?.path).toContain("Projekt_2024-001_");
    expect(result.project?.path).toContain("Gehäuse");
  });

  it("gibt Fehler zurück wenn kein Projektverzeichnis konfiguriert", async () => {
    mockLoadConfig.mockResolvedValueOnce({
      ...FULL_CONFIG,
      projects: { default_root: "" },
    });
    const result = await createProject({
      project_number: "001",
      project_name: "Test",
      customer: "Test GmbH",
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Projektverzeichnis");
  });

  it("gibt Fehler zurück wenn create_project_structure fehlschlägt", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Verzeichnis konnte nicht erstellt werden"));
    const result = await createProject({
      project_number: "002",
      project_name: "Test",
      customer: "Test GmbH",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("schreibt project_id korrekt", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const result = await createProject({
      project_number: "2024-042",
      project_name: "Flansch",
      customer: "Kunde AG",
    });
    expect(result.project?.project_id).toBe("2024-042");
  });
});

describe("openProject", () => {
  it("wirft Fehler wenn project.json fehlt", async () => {
    mockInvoke.mockResolvedValueOnce(false);
    await expect(openProject("/pfad/zu/projekt")).rejects.toThrow("project.json");
  });

  it("gibt geparste Projektdaten zurück", async () => {
    const project = {
      project_id: "001",
      project_name: "Test",
      customer: "Kunde",
      created_at: new Date().toISOString(),
      created_by: "",
      description: "",
      path: "/pfad/zu/projekt",
      paths: { qcad_2d: "01_2D_QCAD", freecad_3d: "02_3D_FreeCAD", exports: "03_Exports", documentation: "04_Dokumentation" },
      documents: { quality_manual: "", work_instructions: [] },
    };
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(JSON.stringify(project));
    const result = await openProject("/pfad/zu/projekt");
    expect(result.project_id).toBe("001");
    expect(result.project_name).toBe("Test");
  });
});

describe("validateProject", () => {
  it("gibt valid:true zurück wenn alle Pflichtordner und project.json vorhanden sind", async () => {
    mockInvoke.mockResolvedValue(true);
    const result = await validateProject("/pfad/zu/projekt");
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("listet fehlende Ordner auf", async () => {
    mockInvoke
      .mockResolvedValueOnce(true)  // project.json
      .mockResolvedValueOnce(false) // 01_2D_QCAD
      .mockResolvedValue(true);     // Rest
    const result = await validateProject("/pfad/zu/projekt");
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("01_2D_QCAD");
  });

  it("meldet fehlende project.json", async () => {
    mockInvoke.mockResolvedValueOnce(false).mockResolvedValue(true);
    const result = await validateProject("/pfad/zu/projekt");
    expect(result.missing).toContain("project.json");
  });
});
