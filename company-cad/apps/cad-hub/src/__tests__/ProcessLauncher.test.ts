import { describe, it, expect, vi, beforeEach } from "vitest";
import { openInQCAD, openInFreeCAD } from "../services/ProcessLauncher";

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

const CONFIG_WITH_TOOLS = {
  app: { name: "CompanyCAD Hub", version: "0.1.0", language: "de-DE" },
  branding: { logo_path: "", primary_color: "#1f2937", accent_color: "#2563eb" },
  tools: { qcad_executable: "/usr/bin/qcad", freecad_executable: "/usr/bin/freecad" },
  documents: { quality_manual_url: "", work_instruction_base_url: "" },
  projects: { default_root: "/home/user/Projekte" },
};

const CONFIG_NO_TOOLS = {
  ...CONFIG_WITH_TOOLS,
  tools: { qcad_executable: "", freecad_executable: "" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("openInQCAD", () => {
  it("gibt deutsche Fehlermeldung zurück wenn qcad_executable nicht konfiguriert", async () => {
    mockLoadConfig.mockResolvedValueOnce(CONFIG_NO_TOOLS);
    const result = await openInQCAD("/projekt", "/datei.dxf");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("QCAD");
    expect(result.message).toContain("Einstellungen");
  });

  it("gibt Fehler zurück wenn Datei nicht existiert", async () => {
    mockLoadConfig.mockResolvedValueOnce(CONFIG_WITH_TOOLS);
    mockInvoke.mockResolvedValueOnce(false); // check_path → false
    const result = await openInQCAD("/projekt", "/datei.dxf");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("nicht gefunden");
  });

  it("startet QCAD mit -locale de Argument", async () => {
    mockLoadConfig.mockResolvedValueOnce(CONFIG_WITH_TOOLS);
    mockInvoke.mockResolvedValueOnce(true); // check_path → true
    mockInvoke.mockResolvedValueOnce({ pid: 1234, launched: true, message: "Gestartet" });
    const result = await openInQCAD("/projekt", "/datei.dxf");
    expect(result.ok).toBe(true);
    expect(result.pid).toBe(1234);
    const launchCall = mockInvoke.mock.calls.find(
      (c) => c[0] === "launch_tool"
    );
    expect(launchCall?.[1]).toMatchObject({
      executable: "/usr/bin/qcad",
      args: ["-locale", "de"],
    });
  });

  it("gibt verständliche Fehlermeldung zurück bei Prozessstart-Fehler", async () => {
    mockLoadConfig.mockResolvedValueOnce(CONFIG_WITH_TOOLS);
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockRejectedValueOnce(new Error("spawn ENOENT"));
    const result = await openInQCAD("/projekt", "/datei.dxf");
    expect(result.ok).toBe(false);
    expect(result.message.length).toBeGreaterThan(0);
  });
});

describe("openInFreeCAD", () => {
  it("gibt deutsche Fehlermeldung zurück wenn freecad_executable nicht konfiguriert", async () => {
    mockLoadConfig.mockResolvedValueOnce(CONFIG_NO_TOOLS);
    const result = await openInFreeCAD("/projekt", "/modell.FCStd");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("FreeCAD");
    expect(result.message).toContain("Einstellungen");
  });

  it("startet FreeCAD ohne extra Argumente", async () => {
    mockLoadConfig.mockResolvedValueOnce(CONFIG_WITH_TOOLS);
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce({ pid: 5678, launched: true, message: "Gestartet" });
    const result = await openInFreeCAD("/projekt", "/modell.FCStd");
    expect(result.ok).toBe(true);
    const launchCall = mockInvoke.mock.calls.find(
      (c) => c[0] === "launch_tool"
    );
    expect(launchCall?.[1]).toMatchObject({
      executable: "/usr/bin/freecad",
      args: [],
    });
  });
});
