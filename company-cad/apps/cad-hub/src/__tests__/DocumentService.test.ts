import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadDocuments, searchDocuments, openDocument } from "../services/DocumentService";
import type { HubDocument } from "../services/DocumentService";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  open: vi.fn(),
}));

vi.mock("../services/LoggingService", () => ({
  writeLog: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-opener";
const mockInvoke = vi.mocked(invoke);
const mockOpen = vi.mocked(open);

const SAMPLE_DOCS: HubDocument[] = [
  { id: "qm-001", title: "Qualitätshandbuch", type: "url", category: "Qualität", url: "https://example.com/qm", tags: ["qualität", "handbuch"] },
  { id: "aw-001", title: "Arbeitsanweisung 2D", type: "url", category: "CAD", url: "https://example.com/2d", tags: ["qcad", "2d"] },
  { id: "aw-002", title: "Arbeitsanweisung 3D", type: "url", category: "CAD", url: "https://example.com/3d", tags: ["freecad", "3d"] },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadDocuments", () => {
  it("gibt geparste Dokumente zurück", async () => {
    mockInvoke.mockResolvedValueOnce(JSON.stringify(SAMPLE_DOCS));
    const docs = await loadDocuments("/config/documents.json");
    expect(docs).toHaveLength(3);
    expect(docs[0].id).toBe("qm-001");
  });

  it("gibt leeres Array bei Lesefehler zurück", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Datei nicht gefunden"));
    const docs = await loadDocuments("/nicht/existierend.json");
    expect(docs).toHaveLength(0);
  });

  it("gibt leeres Array bei ungültigem JSON zurück", async () => {
    mockInvoke.mockResolvedValueOnce("kein gültiges json {{{");
    const docs = await loadDocuments("/kaputt.json");
    expect(docs).toHaveLength(0);
  });
});

describe("searchDocuments", () => {
  it("findet Dokumente nach Titel", () => {
    const result = searchDocuments(SAMPLE_DOCS, "Qualitäts");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("qm-001");
  });

  it("findet Dokumente nach Kategorie", () => {
    const result = searchDocuments(SAMPLE_DOCS, "CAD");
    expect(result).toHaveLength(2);
  });

  it("findet Dokumente nach Tag", () => {
    const result = searchDocuments(SAMPLE_DOCS, "freecad");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("aw-002");
  });

  it("gibt alle Dokumente zurück bei leerem Suchbegriff", () => {
    const result = searchDocuments(SAMPLE_DOCS, "");
    expect(result).toHaveLength(3);
  });

  it("ist nicht case-sensitiv", () => {
    const result = searchDocuments(SAMPLE_DOCS, "QCAD");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("openDocument", () => {
  it("öffnet URL-Dokument über Tauri opener", async () => {
    mockOpen.mockResolvedValueOnce(undefined);
    await openDocument(SAMPLE_DOCS[0]);
    expect(mockOpen).toHaveBeenCalledWith("https://example.com/qm");
  });

  it("wirft verständlichen Fehler wenn URL fehlt", async () => {
    const noUrlDoc: HubDocument = { id: "x", title: "Kein Link", type: "url", category: "Test" };
    await expect(openDocument(noUrlDoc)).rejects.toThrow("konfigurierten");
  });
});
