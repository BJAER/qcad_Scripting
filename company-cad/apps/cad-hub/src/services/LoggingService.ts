import { invoke } from "@tauri-apps/api/core";

export interface LogEntry {
  timestamp: string;
  action: string;
  project_id: string;
  input: Record<string, unknown>;
  result: "success" | "warning" | "error";
  warnings: string[];
  errors: string[];
}

const LOG_PATH = "~/companycad_logs/hub_log.jsonl";

export async function writeLog(
  entry: Omit<LogEntry, "timestamp">
): Promise<void> {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  await invoke<void>("write_log_entry", {
    logPath: LOG_PATH,
    entry: fullEntry,
  });
}
