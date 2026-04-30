import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeLog } from "../services/LoggingService";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("writeLog", () => {
  it("fügt ISO-Timestamp zum Logeintrag hinzu", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeLog({
      action: "app_started",
      project_id: "",
      input: {},
      result: "success",
      warnings: [],
      errors: [],
    });

    const [, args] = mockInvoke.mock.calls[0];
    const entry = (args as { entry: { timestamp: string } }).entry;
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("ruft write_log_entry mit vollständigem Eintrag auf", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeLog({
      action: "qcad_started",
      project_id: "2024-001",
      input: { filePath: "/datei.dxf" },
      result: "success",
      warnings: [],
      errors: [],
    });

    expect(mockInvoke).toHaveBeenCalledWith("write_log_entry", expect.objectContaining({
      entry: expect.objectContaining({
        action: "qcad_started",
        project_id: "2024-001",
        result: "success",
      }),
    }));
  });

  it("enthält Fehlerliste im Logeintrag", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeLog({
      action: "qcad_started",
      project_id: "",
      input: {},
      result: "error",
      warnings: [],
      errors: ["QCAD nicht gefunden"],
    });

    const [, args] = mockInvoke.mock.calls[0];
    const entry = (args as { entry: { errors: string[] } }).entry;
    expect(entry.errors).toContain("QCAD nicht gefunden");
  });

  it("logPath wird übergeben", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeLog({
      action: "test",
      project_id: "",
      input: {},
      result: "success",
      warnings: [],
      errors: [],
    });

    const [, args] = mockInvoke.mock.calls[0];
    expect((args as { logPath: string }).logPath).toContain("hub_log.jsonl");
  });
});
