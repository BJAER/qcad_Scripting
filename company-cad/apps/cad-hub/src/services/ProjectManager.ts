import { invoke } from "@tauri-apps/api/core";
import { loadConfig } from "./ConfigService";
import { writeLog } from "./LoggingService";

export interface ProjectMetadata {
  project_number: string;
  project_name: string;
  customer: string;
  created_by?: string;
  description?: string;
}

export interface Project {
  project_id: string;
  project_name: string;
  customer: string;
  created_at: string;
  created_by: string;
  description: string;
  path: string;
  paths: {
    qcad_2d: string;
    freecad_3d: string;
    exports: string;
    documentation: string;
  };
  documents: {
    quality_manual: string;
    work_instructions: string[];
  };
}

export interface ProjectResult {
  ok: boolean;
  project?: Project;
  message: string;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
}

const REQUIRED_SUBFOLDERS = [
  "01_2D_QCAD",
  "02_3D_FreeCAD",
  "03_Exports/PDF",
  "03_Exports/DXF",
  "03_Exports/STEP",
  "04_Dokumentation",
  "05_Arbeitsanweisungen",
];

export async function createProject(
  metadata: ProjectMetadata,
  rootDir?: string
): Promise<ProjectResult> {
  const root = rootDir !== undefined ? rootDir : (await loadConfig()).projects.default_root;

  if (!root.trim()) {
    const msg =
      "Kein Projektverzeichnis konfiguriert. Bitte lege in den Einstellungen einen Speicherort für Projekte fest.";
    return { ok: false, message: msg, errors: [msg] };
  }

  const safeName = sanitizeName(metadata.project_name);
  const dirName = `Projekt_${metadata.project_number}_${safeName}`;
  const projectPath = `${root}/${dirName}`;

  const project: Project = {
    project_id: metadata.project_number,
    project_name: metadata.project_name,
    customer: metadata.customer,
    created_at: new Date().toISOString(),
    created_by: metadata.created_by ?? "",
    description: metadata.description ?? "",
    path: projectPath,
    paths: {
      qcad_2d: "01_2D_QCAD",
      freecad_3d: "02_3D_FreeCAD",
      exports: "03_Exports",
      documentation: "04_Dokumentation",
    },
    documents: {
      quality_manual: "",
      work_instructions: [],
    },
  };

  try {
    await invoke<void>("create_project_structure", {
      projectPath,
      subfolders: REQUIRED_SUBFOLDERS,
      manifest: JSON.stringify(project, null, 2),
    });

    await writeLog({
      action: "project_created",
      project_id: metadata.project_number,
      input: { project_name: metadata.project_name, path: projectPath },
      result: "success",
      warnings: [],
      errors: [],
    });

    return {
      ok: true,
      project,
      message: `Projekt "${metadata.project_name}" wurde erfolgreich angelegt.`,
      errors: [],
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : `Projekt konnte nicht erstellt werden. Bitte prüfe das Projektverzeichnis.`;

    await writeLog({
      action: "project_created",
      project_id: metadata.project_number,
      input: { project_name: metadata.project_name },
      result: "error",
      warnings: [],
      errors: [msg],
    });

    return { ok: false, message: msg, errors: [msg] };
  }
}

export async function openProject(projectPath: string): Promise<Project> {
  const manifestPath = `${projectPath}/project.json`;
  const exists = await invoke<boolean>("check_path", { path: manifestPath });
  if (!exists) {
    throw new Error(
      `Kein gültiges Projekt gefunden. Die Datei project.json fehlt unter: ${projectPath}`
    );
  }

  const raw = await invoke<string>("read_text_file", { path: manifestPath });

  await writeLog({
    action: "project_opened",
    project_id: projectPath,
    input: { projectPath },
    result: "success",
    warnings: [],
    errors: [],
  });

  return JSON.parse(raw) as Project;
}

export async function validateProject(
  projectPath: string
): Promise<ValidationResult> {
  const missing: string[] = [];

  const manifestExists = await invoke<boolean>("check_path", {
    path: `${projectPath}/project.json`,
  });
  if (!manifestExists) missing.push("project.json");

  for (const subfolder of REQUIRED_SUBFOLDERS) {
    const fullPath = `${projectPath}/${subfolder}`;
    const exists = await invoke<boolean>("check_path", { path: fullPath });
    if (!exists) missing.push(subfolder);
  }

  return { valid: missing.length === 0, missing };
}

function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9äöüÄÖÜß_\- ]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}
