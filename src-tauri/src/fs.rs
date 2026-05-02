use std::path::Path;
use std::time::SystemTime;

use serde::Serialize;
use tauri_plugin_opener::OpenerExt;

use crate::path_safety::{ensure_within, reject_traversal, validate_filename};

#[derive(Serialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: u64,
    pub extension: Option<String>,
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(&path);

    let mut entries: Vec<FileEntry> = std::fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter_map(|entry| {
            let path = entry.path();
            let metadata = entry.metadata().ok()?;
            let name = entry.file_name().into_string().ok()?;

            let modified = metadata
                .modified()
                .ok()
                .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            let is_dir = metadata.is_dir();
            let extension = if !is_dir {
                path.extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.to_lowercase())
            } else {
                None
            };

            Some(FileEntry {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir,
                size: if !is_dir { metadata.len() } else { 0 },
                modified,
                extension,
            })
        })
        .collect();

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Cannot determine home directory".to_string())
}

#[tauri::command]
pub fn open_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.opener()
        .open_path(path, None::<&str>)
        .map_err(|e| e.to_string())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let dst_path = dst.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_recursive(&entry.path(), &dst_path)?;
        } else {
            std::fs::copy(entry.path(), dst_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn create_dir(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    reject_traversal(p)?;
    std::fs::create_dir_all(p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    reject_traversal(p)?;
    if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
        validate_filename(name)?;
    }
    std::fs::File::create(p).map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_entry(src: String, new_name: String) -> Result<(), String> {
    validate_filename(&new_name)?;
    let src_path = Path::new(&src);
    reject_traversal(src_path)?;
    let parent = src_path.parent().ok_or("Sin directorio padre")?;
    let dest = parent.join(&new_name);
    ensure_within(parent, &dest)?;
    std::fs::rename(src_path, &dest).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_entry(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    reject_traversal(p)?;
    let meta = std::fs::symlink_metadata(p).map_err(|e| e.to_string())?;
    if meta.file_type().is_symlink() {
        std::fs::remove_file(p).map_err(|e| e.to_string())
    } else if meta.is_dir() {
        std::fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn copy_entry(src: String, dest: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let dest_path = Path::new(&dest);
    reject_traversal(src_path)?;
    reject_traversal(dest_path)?;
    if let Some(name) = dest_path.file_name().and_then(|n| n.to_str()) {
        validate_filename(name)?;
    }
    if src_path.is_dir() {
        copy_dir_recursive(src_path, dest_path).map_err(|e| e.to_string())
    } else {
        std::fs::copy(src_path, dest_path).map(|_| ()).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn move_entry(src: String, dest: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let dest_path = Path::new(&dest);
    reject_traversal(src_path)?;
    reject_traversal(dest_path)?;
    if let Some(name) = dest_path.file_name().and_then(|n| n.to_str()) {
        validate_filename(name)?;
    }
    std::fs::rename(src_path, dest_path).map_err(|e| e.to_string())
}
