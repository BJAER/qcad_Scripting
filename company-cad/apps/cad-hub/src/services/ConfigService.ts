import { invoke } from "@tauri-apps/api/core";
import { DEFAULT_CONFIG } from "../config/defaults";

export interface Config {
  app: {
    name: string;
    version: string;
    language: string;
  };
  branding: {
    logo_path: string;
    primary_color: string;
    accent_color: string;
  };
  tools: {
    qcad_executable: string;
    freecad_executable: string;
  };
  documents: {
    quality_manual_url: string;
    work_instruction_base_url: string;
  };
  projects: {
    default_root: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const USER_CONFIG_PATH = "~/.config/companycad/config.json";

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await invoke<string>("read_text_file", { path: USER_CONFIG_PATH });
    const userConfig = JSON.parse(raw) as Partial<Config>;
    return deepMerge(DEFAULT_CONFIG, userConfig);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const content = JSON.stringify(config, null, 2);
  await invoke<void>("write_text_file", { path: USER_CONFIG_PATH, content });
}

export function validateConfig(config: Config): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.tools.qcad_executable.trim()) {
    errors.push(
      "QCAD wurde nicht konfiguriert. Bitte trage den Programmpfad in den Einstellungen ein."
    );
  }
  if (!config.tools.freecad_executable.trim()) {
    errors.push(
      "FreeCAD wurde nicht konfiguriert. Bitte trage den Programmpfad in den Einstellungen ein."
    );
  }
  if (!config.projects.default_root.trim()) {
    warnings.push(
      "Kein Standard-Projektverzeichnis festgelegt. Bitte konfiguriere einen Speicherort für Projekte."
    );
  }
  if (!config.documents.quality_manual_url.trim()) {
    warnings.push("URL für das Qualitätshandbuch ist nicht konfiguriert.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };
  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideVal = override[key];
    const baseVal = base[key];
    if (
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === "object" &&
      baseVal !== null
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>
      ) as T[keyof T];
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[keyof T];
    }
  }
  return result;
}
