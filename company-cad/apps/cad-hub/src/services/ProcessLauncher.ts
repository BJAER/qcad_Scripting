import { invoke } from "@tauri-apps/api/core";
import { loadConfig } from "./ConfigService";
import { writeLog } from "./LoggingService";

export interface LaunchResult {
  ok: boolean;
  pid?: number;
  message: string;
  warnings: string[];
  errors: string[];
}

export async function openInQCAD(
  projectPath: string,
  filePath: string
): Promise<LaunchResult> {
  const config = await loadConfig();

  if (!config.tools.qcad_executable.trim()) {
    const msg =
      "QCAD wurde nicht gefunden. Bitte prüfe den Programmpfad in den Einstellungen.";
    await writeLog({
      action: "qcad_started",
      project_id: projectPath,
      input: { filePath },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    return { ok: false, message: msg, warnings: [], errors: [msg] };
  }

  const fileExists = await invoke<boolean>("check_path", { path: filePath });
  if (!fileExists) {
    const msg = `Die DXF-Datei wurde nicht gefunden: ${filePath}`;
    await writeLog({
      action: "qcad_started",
      project_id: projectPath,
      input: { filePath },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    return { ok: false, message: msg, warnings: [], errors: [msg] };
  }

  try {
    const raw = await invoke<{ pid: number | null; launched: boolean; message: string }>(
      "launch_tool",
      {
        executable: config.tools.qcad_executable,
        filePath,
        args: ["-locale", "de"],
      }
    );
    await writeLog({
      action: "qcad_started",
      project_id: projectPath,
      input: { filePath, executable: config.tools.qcad_executable },
      result: "success",
      warnings: [],
      errors: [],
    });
    return {
      ok: true,
      pid: raw.pid ?? undefined,
      message: "QCAD wurde gestartet.",
      warnings: [],
      errors: [],
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "QCAD konnte nicht gestartet werden. Bitte prüfe den Programmpfad.";
    await writeLog({
      action: "qcad_started",
      project_id: projectPath,
      input: { filePath },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    return { ok: false, message: msg, warnings: [], errors: [msg] };
  }
}

export async function openInFreeCAD(
  projectPath: string,
  filePath: string
): Promise<LaunchResult> {
  const config = await loadConfig();

  if (!config.tools.freecad_executable.trim()) {
    const msg =
      "FreeCAD wurde nicht gefunden. Bitte prüfe den Programmpfad in den Einstellungen.";
    await writeLog({
      action: "freecad_started",
      project_id: projectPath,
      input: { filePath },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    return { ok: false, message: msg, warnings: [], errors: [msg] };
  }

  const fileExists = await invoke<boolean>("check_path", { path: filePath });
  if (!fileExists) {
    const msg = `Die Modelldatei wurde nicht gefunden: ${filePath}`;
    await writeLog({
      action: "freecad_started",
      project_id: projectPath,
      input: { filePath },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    return { ok: false, message: msg, warnings: [], errors: [msg] };
  }

  try {
    const raw = await invoke<{ pid: number | null; launched: boolean; message: string }>(
      "launch_tool",
      {
        executable: config.tools.freecad_executable,
        filePath,
        args: [],
      }
    );
    await writeLog({
      action: "freecad_started",
      project_id: projectPath,
      input: { filePath, executable: config.tools.freecad_executable },
      result: "success",
      warnings: [],
      errors: [],
    });
    return {
      ok: true,
      pid: raw.pid ?? undefined,
      message: "FreeCAD wurde gestartet.",
      warnings: [],
      errors: [],
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "FreeCAD konnte nicht gestartet werden. Bitte prüfe den Programmpfad.";
    await writeLog({
      action: "freecad_started",
      project_id: projectPath,
      input: { filePath },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    return { ok: false, message: msg, warnings: [], errors: [msg] };
  }
}
