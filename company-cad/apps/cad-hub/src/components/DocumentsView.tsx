import { useState, useEffect } from "react";
import { loadDocuments, openDocument, searchDocuments, type HubDocument } from "../services/DocumentService";
import type { Config } from "../services/ConfigService";

type StatusType = "idle" | "success" | "warning" | "error";

interface DocumentsViewProps {
  config: Config;
  onStatus: (message: string, type?: StatusType) => void;
  onError: (message: string) => void;
}

export default function DocumentsView({ config, onStatus, onError }: DocumentsViewProps) {
  const [docs, setDocs] = useState<HubDocument[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  const base = config.documents.work_instruction_base_url || config.documents.quality_manual_url;

  useEffect(() => {
    if (!base) { setLoading(false); return; }
    loadDocuments(base)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [base]);

  const visible = searchDocuments(docs, query);

  async function handleOpen(doc: HubDocument) {
    setOpening(doc.id);
    try {
      await openDocument(doc);
      onStatus(`„${doc.title}" wird geöffnet.`, "success");
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setOpening(null);
    }
  }

  if (!base) {
    return (
      <main className="app-main">
        <section className="docs-section">
          <h2>Dokumente</h2>
          <p className="docs-empty">Kein Dokumentenpfad konfiguriert. Bitte trage eine URL oder einen Pfad in den Einstellungen ein.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-main" aria-label="Dokumente">
      <section className="docs-section">
        <div className="docs-header">
          <h2>Dokumente</h2>
          <input
            className="settings-input docs-search"
            type="search"
            placeholder="Dokument suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Dokumente durchsuchen"
          />
        </div>

        {loading && <p className="docs-empty">Lädt…</p>}

        {!loading && visible.length === 0 && (
          <p className="docs-empty">
            {query ? `Keine Treffer für „${query}".` : "Keine Dokumente gefunden."}
          </p>
        )}

        {!loading && visible.length > 0 && (
          <ul className="docs-list" role="list">
            {visible.map((doc) => (
              <li key={doc.id} className="docs-item" role="listitem">
                <span className="docs-icon" aria-hidden="true">
                  {doc.type === "url" ? "🌐" : doc.type === "pdf" ? "📄" : "📁"}
                </span>
                <div className="docs-info">
                  <span className="docs-title">{doc.title}</span>
                  <span className="docs-category">{doc.category}</span>
                </div>
                <button
                  className="btn-primary docs-open-btn"
                  onClick={() => handleOpen(doc)}
                  disabled={opening === doc.id}
                  aria-label={`${doc.title} öffnen`}
                >
                  {opening === doc.id ? "…" : "Öffnen"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
