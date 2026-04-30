import type { Config } from "../services/ConfigService";

export const DEFAULT_CONFIG: Config = {
  app: {
    name: "CompanyCAD Hub",
    version: "0.1.0",
    language: "de-DE",
  },
  branding: {
    logo_path: "assets/logo-placeholder.svg",
    primary_color: "#1f2937",
    accent_color: "#2563eb",
  },
  tools: {
    qcad_executable: "",
    freecad_executable: "",
  },
  documents: {
    quality_manual_url: "",
    work_instruction_base_url: "",
  },
  projects: {
    default_root: "",
  },
};
