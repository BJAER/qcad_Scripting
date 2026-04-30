use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;
use std::process::Command;

// Expandiert ~ zum tatsächlichen Home-Verzeichnis
fn expand_tilde(path: &str) -> String {
    if path.starts_with("~/") || path == "~" {
        if let Some(home) = dirs::home_dir() {
            return home.join(path.trim_start_matches("~/")).to_string_lossy().into_owned();
        }
    }
    path.to_string()
}

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

#[tauri::command]
pub fn launch_tool(
    executable: String,
    file_path: Option<String>,
    args: Vec<String>,
) -> Result<LaunchResult, String> {
    let exe = expand_tilde(&executable);
    if !Path::new(&exe).exists() {
        return Err(format!(
            "Das Programm wurde nicht gefunden: {}. Bitte prüfe den Pfad in den Einstellungen.",
            exe
        ));
    }
    let mut cmd = Command::new(&exe);
    cmd.args(&args);
    if let Some(ref p) = file_path {
        cmd.arg(expand_tilde(p));
    }
    match cmd.spawn() {
        Ok(child) => Ok(LaunchResult {
            pid: Some(child.id()),
            launched: true,
            message: format!("Programm gestartet: {}", exe),
        }),
        Err(e) => Err(format!(
            "Das Programm konnte nicht gestartet werden. Bitte prüfe den Pfad in den Einstellungen. ({})",
            e
        )),
    }
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    let p = expand_tilde(&path);
    std::fs::read_to_string(&p).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => format!("Datei nicht gefunden: {}", p),
        std::io::ErrorKind::PermissionDenied => {
            format!("Zugriff verweigert: {}. Bitte prüfe die Dateiberechtigungen.", p)
        }
        _ => format!("Datei konnte nicht gelesen werden: {} ({})", p, e),
    })
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    let p = expand_tilde(&path);
    let path_obj = Path::new(&p);
    if let Some(parent) = path_obj.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            format!("Verzeichnis konnte nicht erstellt werden: {} ({})", parent.display(), e)
        })?;
    }
    std::fs::write(&p, &content)
        .map_err(|e| format!("Datei konnte nicht geschrieben werden: {} ({})", p, e))
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    let p = expand_tilde(&path);
    std::fs::create_dir_all(&p)
        .map_err(|e| format!("Verzeichnis konnte nicht erstellt werden: {} ({})", p, e))
}

#[tauri::command]
pub fn create_project_structure(
    project_path: String,
    subfolders: Vec<String>,
    manifest: String,
) -> Result<(), String> {
    let p = expand_tilde(&project_path);
    std::fs::create_dir_all(&p).map_err(|e| {
        format!("Projektverzeichnis konnte nicht erstellt werden: {} ({})", p, e)
    })?;
    for subfolder in &subfolders {
        let full = format!("{}/{}", p, subfolder);
        std::fs::create_dir_all(&full).map_err(|e| {
            format!("Unterordner konnte nicht erstellt werden: {} ({})", full, e)
        })?;
    }
    let manifest_path = format!("{}/project.json", p);
    std::fs::write(&manifest_path, &manifest).map_err(|e| {
        format!("project.json konnte nicht geschrieben werden: {} ({})", manifest_path, e)
    })
}

#[tauri::command]
pub fn check_path(path: String) -> bool {
    Path::new(&expand_tilde(&path)).exists()
}

#[tauri::command]
pub fn write_log_entry(log_path: String, entry: LogEntry) -> Result<(), String> {
    let p = expand_tilde(&log_path);
    let path_obj = Path::new(&p);
    if let Some(parent) = path_obj.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            format!("Log-Verzeichnis konnte nicht erstellt werden: {} ({})", parent.display(), e)
        })?;
    }
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&p)
        .map_err(|e| format!("Log-Datei konnte nicht geöffnet werden: {} ({})", p, e))?;
    let line = serde_json::to_string(&entry)
        .map_err(|e| format!("Log-Eintrag konnte nicht serialisiert werden: {}", e))?;
    writeln!(file, "{}", line)
        .map_err(|e| format!("Log-Eintrag konnte nicht geschrieben werden: {}", e))
}
