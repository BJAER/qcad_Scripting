use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchResult {
    pub pid: Option<u32>,
    pub launched: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub action: String,
    pub project_id: String,
    pub input: serde_json::Value,
    pub result: String,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

/// Startet ein externes Programm (QCAD oder FreeCAD) als fire-and-forget Prozess.
#[tauri::command]
pub fn launch_tool(
    executable: String,
    file_path: Option<String>,
    args: Vec<String>,
) -> Result<LaunchResult, String> {
    if !Path::new(&executable).exists() {
        return Err(format!(
            "Das Programm wurde nicht gefunden: {}. Bitte prüfe den Pfad in den Einstellungen.",
            executable
        ));
    }

    let mut cmd = Command::new(&executable);
    cmd.args(&args);
    if let Some(ref path) = file_path {
        cmd.arg(path);
    }

    match cmd.spawn() {
        Ok(child) => Ok(LaunchResult {
            pid: Some(child.id()),
            launched: true,
            message: format!("Programm gestartet: {}", executable),
        }),
        Err(e) => Err(format!(
            "Das Programm konnte nicht gestartet werden. Bitte prüfe den Pfad in den Einstellungen. ({})",
            e
        )),
    }
}

/// Liest eine Textdatei vom Dateisystem.
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => {
            format!("Datei nicht gefunden: {}", path)
        }
        std::io::ErrorKind::PermissionDenied => {
            format!("Zugriff verweigert: {}. Bitte prüfe die Dateiberechtigungen.", path)
        }
        _ => format!("Datei konnte nicht gelesen werden: {} ({})", path, e),
    })
}

/// Schreibt Text in eine Datei. Legt übergeordnete Verzeichnisse an falls nötig.
#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    let p = Path::new(&path);
    if let Some(parent) = p.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            format!("Verzeichnis konnte nicht erstellt werden: {} ({})", parent.display(), e)
        })?;
    }
    std::fs::write(&path, &content).map_err(|e| {
        format!("Datei konnte nicht geschrieben werden: {} ({})", path, e)
    })
}

/// Legt ein Verzeichnis an (inkl. aller übergeordneten Verzeichnisse).
#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path)
        .map_err(|e| format!("Verzeichnis konnte nicht erstellt werden: {} ({})", path, e))
}

/// Erstellt die vollständige Projektstruktur mit allen Unterordnern und der project.json.
#[tauri::command]
pub fn create_project_structure(
    project_path: String,
    subfolders: Vec<String>,
    manifest: String,
) -> Result<(), String> {
    std::fs::create_dir_all(&project_path).map_err(|e| {
        format!("Projektverzeichnis konnte nicht erstellt werden: {} ({})", project_path, e)
    })?;

    for subfolder in &subfolders {
        let full_path = format!("{}/{}", project_path, subfolder);
        std::fs::create_dir_all(&full_path).map_err(|e| {
            format!("Unterordner konnte nicht erstellt werden: {} ({})", full_path, e)
        })?;
    }

    let manifest_path = format!("{}/project.json", project_path);
    std::fs::write(&manifest_path, &manifest).map_err(|e| {
        format!("project.json konnte nicht geschrieben werden: {} ({})", manifest_path, e)
    })?;

    Ok(())
}

/// Prüft ob ein Pfad (Datei oder Verzeichnis) existiert.
#[tauri::command]
pub fn check_path(path: String) -> bool {
    Path::new(&path).exists()
}

/// Schreibt einen Logeintrag als JSON-Zeile an hub_log.jsonl.
#[tauri::command]
pub fn write_log_entry(log_path: String, entry: LogEntry) -> Result<(), String> {
    let p = Path::new(&log_path);
    if let Some(parent) = p.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            format!("Log-Verzeichnis konnte nicht erstellt werden: {} ({})", parent.display(), e)
        })?;
    }

    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Log-Datei konnte nicht geöffnet werden: {} ({})", log_path, e))?;

    let line = serde_json::to_string(&entry)
        .map_err(|e| format!("Log-Eintrag konnte nicht serialisiert werden: {}", e))?;

    writeln!(file, "{}", line)
        .map_err(|e| format!("Log-Eintrag konnte nicht geschrieben werden: {}", e))
}
