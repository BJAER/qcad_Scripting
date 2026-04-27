import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadConfig, validateConfig } from "../services/ConfigService";
import { DEFAULT_CONFIG } from "../config/defaults";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadConfig", () => {
  it("gibt DEFAULT_CONFIG zurück wenn keine Benutzerkonfiguration existiert", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Datei nicht gefunden"));
    const config = await loadConfig();
    expect(config.app.name).toBe("CompanyCAD Hub");
    expect(config.app.version).toBe("0.1.0");
  });

  it("merged Benutzerkonfiguration über die Standardwerte", async () => {
    const partial = {
      tools: { qcad_executable: "/usr/bin/qcad", freecad_executable: "/usr/bin/freecad" },
    };
    mockInvoke.mockResolvedValueOnce(JSON.stringify(partial));
    const config = await loadConfig();
    expect(config.tools.qcad_executable).toBe("/usr/bin/qcad");
    expect(config.tools.freecad_executable).toBe("/usr/bin/freecad");
    expect(config.app.name).toBe("CompanyCAD Hub");
  });

  it("behält Standardwerte für nicht überschriebene Felder", async () => {
    const partial = { app: { name: "MeinCAD Hub" } };
    mockInvoke.mockResolvedValueOnce(JSON.stringify(partial));
    const config = await loadConfig();
    expect(config.app.name).toBe("MeinCAD Hub");
    expect(config.app.version).toBe("0.1.0");
  });
});

describe("validateConfig", () => {
  it("gibt valid:true für vollständige Konfiguration zurück", () => {
    const config = {
      ...DEFAULT_CONFIG,
      tools: {
        qcad_executable: "/usr/bin/qcad",
        freecad_executable: "/usr/bin/freecad",
      },
      projects: { default_root: "/home/user/Projekte" },
      documents: {
        quality_manual_url: "https://example.com/qm",
        work_instruction_base_url: "",
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("gibt Fehler zurück wenn qcad_executable fehlt", () => {
    const config = {
      ...DEFAULT_CONFIG,
      tools: { qcad_executable: "", freecad_executable: "/usr/bin/freecad" },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("QCAD"))).toBe(true);
  });

  it("gibt Fehler zurück wenn freecad_executable fehlt", () => {
    const config = {
      ...DEFAULT_CONFIG,
      tools: { qcad_executable: "/usr/bin/qcad", freecad_executable: "" },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("FreeCAD"))).toBe(true);
  });

  it("gibt Warnungen (keine Fehler) für fehlende optionale Felder zurück", () => {
    const config = {
      ...DEFAULT_CONFIG,
      tools: {
        qcad_executable: "/usr/bin/qcad",
        freecad_executable: "/usr/bin/freecad",
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });
});
