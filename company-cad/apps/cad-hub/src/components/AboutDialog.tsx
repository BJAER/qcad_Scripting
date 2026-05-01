import { useEffect } from "react";

interface AboutDialogProps {
  appName: string;
  version: string;
  onClose: () => void;
}

export default function AboutDialog({ appName, version, onClose }: AboutDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Über CompanyCAD Hub"
      onClick={onClose}
    >
      <div className="dialog-box dialog-box--neutral" onClick={(e) => e.stopPropagation()}>
        <h3>Über {appName}</h3>
        <dl className="about-info">
          <dt>Version</dt>
          <dd>{version}</dd>
          <dt>Tech-Stack</dt>
          <dd>Tauri 2 · React 18 · Rust</dd>
          <dt>Lizenzen</dt>
          <dd>
            <ul className="about-list">
              <li>App: MIT/Apache-2.0</li>
              <li>QCAD: GPLv3 (extern, keine Codevermischung)</li>
              <li>FreeCAD: LGPL 2.1+ (extern, keine Codevermischung)</li>
            </ul>
          </dd>
        </dl>
        <div className="settings-actions">
          <button className="btn-primary" onClick={onClose} autoFocus>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
