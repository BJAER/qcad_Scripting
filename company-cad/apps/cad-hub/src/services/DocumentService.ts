import { invoke } from "@tauri-apps/api/core";
import { openUrl, openPath } from "@tauri-apps/plugin-opener";
import { writeLog } from "./LoggingService";

export interface HubDocument {
  id: string;
  title: string;
  type: "url" | "pdf" | "local_file" | "markdown";
  category: string;
  url?: string;
  path?: string;
  tags?: string[];
}

export async function loadDocuments(documentsJsonPath: string): Promise<HubDocument[]> {
  try {
    const raw = await invoke<string>("read_text_file", { path: documentsJsonPath });
    return JSON.parse(raw) as HubDocument[];
  } catch {
    return [];
  }
}

export async function openDocument(doc: HubDocument): Promise<void> {
  if (!doc.url && !doc.path) {
    throw new Error(
      `Dokument "${doc.title}" hat keinen konfigurierten Link oder Pfad.`
    );
  }

  const target = doc.url ?? doc.path ?? "";

  if (!target.trim()) {
    throw new Error(
      `Das Dokument "${doc.title}" ist nicht konfiguriert. Bitte trage eine URL oder einen Pfad ein.`
    );
  }

  try {
    if (doc.type === "url") {
      await openUrl(target);
    } else {
      await openPath(target);
    }
    await writeLog({
      action: "document_opened",
      project_id: "",
      input: { document_id: doc.id, title: doc.title, target },
      result: "success",
      warnings: [],
      errors: [],
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : `Dokument "${doc.title}" konnte nicht geöffnet werden. Bitte prüfe den Link in den Einstellungen.`;
    await writeLog({
      action: "document_opened",
      project_id: "",
      input: { document_id: doc.id, title: doc.title },
      result: "error",
      warnings: [],
      errors: [msg],
    });
    throw new Error(msg);
  }
}

export function searchDocuments(docs: HubDocument[], query: string): HubDocument[] {
  if (!query.trim()) return docs;
  const q = query.toLowerCase();
  return docs.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}
