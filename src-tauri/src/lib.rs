use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;

use ignore::{WalkBuilder, WalkState};
use nucleo_matcher::pattern::{CaseMatching, Normalization, Pattern};
use nucleo_matcher::{Config, Matcher, Utf32Str};
use serde::Serialize;
use tauri::webview::PageLoadEvent;
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_opener::OpenerExt;

#[derive(Serialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: u64,
    pub extension: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct SearchResult {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub score: u32,
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
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
fn get_home_dir() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Cannot determine home directory".to_string())
}

#[tauri::command]
fn open_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.opener()
        .open_path(path, None::<&str>)
        .map_err(|e| e.to_string())
}

const SEARCH_LIMIT: usize = 100;
const WALK_LIMIT: usize = 250_000;
const SKIP_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    ".next",
    "dist",
    "build",
    ".venv",
    "venv",
    "__pycache__",
    ".cache",
    ".turbo",
    ".gradle",
    ".idea",
    ".vscode",
    "Library",
];

struct IndexEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[derive(Default)]
pub struct SearchIndex(Mutex<HashMap<String, Arc<Vec<IndexEntry>>>>);

fn build_index(root: &str) -> Vec<IndexEntry> {
    let entries: Arc<Mutex<Vec<IndexEntry>>> = Arc::new(Mutex::new(Vec::with_capacity(8192)));
    let walked = Arc::new(AtomicUsize::new(0));

    let threads = std::thread::available_parallelism()
        .map(|n| n.get().min(8))
        .unwrap_or(4);

    WalkBuilder::new(root)
        .hidden(false)
        .git_ignore(false)
        .ignore(false)
        .git_global(false)
        .git_exclude(false)
        .filter_entry(|entry| {
            if entry.depth() == 0 {
                return true;
            }
            match entry.file_name().to_str() {
                Some(name) => !SKIP_DIRS.contains(&name),
                None => true,
            }
        })
        .threads(threads)
        .build_parallel()
        .run(|| {
            let entries = entries.clone();
            let walked = walked.clone();

            Box::new(move |entry| {
                if walked.fetch_add(1, Ordering::Relaxed) > WALK_LIMIT {
                    return WalkState::Quit;
                }
                let entry = match entry {
                    Ok(e) => e,
                    Err(_) => return WalkState::Continue,
                };
                if entry.depth() == 0 {
                    return WalkState::Continue;
                }
                let name = match entry.file_name().to_str() {
                    Some(n) => n.to_string(),
                    None => return WalkState::Continue,
                };
                let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
                if let Ok(mut e) = entries.lock() {
                    e.push(IndexEntry {
                        name,
                        path: entry.path().to_string_lossy().into_owned(),
                        is_dir,
                    });
                }
                WalkState::Continue
            })
        });

    Arc::try_unwrap(entries)
        .ok()
        .and_then(|m| m.into_inner().ok())
        .unwrap_or_default()
}

fn get_or_build_index(state: &SearchIndex, root: &str) -> Result<Arc<Vec<IndexEntry>>, String> {
    {
        let map = state.0.lock().map_err(|e| e.to_string())?;
        if let Some(idx) = map.get(root) {
            return Ok(idx.clone());
        }
    }
    let entries = build_index(root);
    let arc = Arc::new(entries);
    let mut map = state.0.lock().map_err(|e| e.to_string())?;
    Ok(map.entry(root.to_string()).or_insert(arc).clone())
}

#[tauri::command]
fn index_path(state: tauri::State<SearchIndex>, root: String) -> Result<usize, String> {
    let idx = get_or_build_index(&state, &root)?;
    Ok(idx.len())
}

#[tauri::command]
fn clear_search_index(state: tauri::State<SearchIndex>) -> Result<(), String> {
    state.0.lock().map_err(|e| e.to_string())?.clear();
    Ok(())
}

#[tauri::command]
fn search_files(
    state: tauri::State<SearchIndex>,
    root: String,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    let query = query.trim();
    if query.is_empty() {
        return Ok(vec![]);
    }

    let index = get_or_build_index(&state, &root)?;

    let pattern = Pattern::parse(query, CaseMatching::Smart, Normalization::Smart);
    let mut matcher = Matcher::new(Config::DEFAULT);
    let mut buf = Vec::new();

    let mut results: Vec<SearchResult> = index
        .iter()
        .filter_map(|e| {
            buf.clear();
            let utf32 = Utf32Str::new(&e.name, &mut buf);
            pattern
                .score(utf32, &mut matcher)
                .map(|score| SearchResult {
                    name: e.name.clone(),
                    path: e.path.clone(),
                    is_dir: e.is_dir,
                    score,
                })
        })
        .collect();

    results.sort_by(|a, b| {
        b.score
            .cmp(&a.score)
            .then_with(|| a.name.len().cmp(&b.name.len()))
    });
    results.truncate(SEARCH_LIMIT);
    Ok(results)
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
fn create_dir(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    std::fs::File::create(&path).map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_entry(src: String, new_name: String) -> Result<(), String> {
    if new_name.contains('/') || new_name.contains('\\') || new_name.is_empty() {
        return Err("Nombre inválido".to_string());
    }
    let src_path = Path::new(&src);
    let parent = src_path.parent().ok_or("Sin directorio padre")?;
    std::fs::rename(src_path, parent.join(&new_name)).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_entry(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        std::fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn copy_entry(src: String, dest: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let dest_path = Path::new(&dest);
    if src_path.is_dir() {
        copy_dir_recursive(src_path, dest_path).map_err(|e| e.to_string())
    } else {
        std::fs::copy(src_path, dest_path).map(|_| ()).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn move_entry(src: String, dest: String) -> Result<(), String> {
    std::fs::rename(&src, &dest).map_err(|e| e.to_string())
}

#[derive(Serialize, Clone)]
pub struct TerminalInfo {
    pub id: String,
    pub name: String,
}

#[cfg(target_os = "macos")]
fn detect_app(app_name: &str) -> bool {
    let candidates = [
        format!("/Applications/{}.app", app_name),
        format!("/System/Applications/{}.app", app_name),
        format!("/System/Applications/Utilities/{}.app", app_name),
        format!(
            "{}/Applications/{}.app",
            std::env::var("HOME").unwrap_or_default(),
            app_name
        ),
    ];
    candidates.iter().any(|p| Path::new(p).exists())
}

fn detect_bin(bin: &str) -> bool {
    std::process::Command::new("which")
        .arg(bin)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
fn list_terminals() -> Vec<TerminalInfo> {
    let mut out = Vec::new();

    #[cfg(target_os = "macos")]
    {
        let apps = [
            ("terminal", "Terminal", "Terminal"),
            ("iterm", "iTerm", "iTerm"),
            ("warp", "Warp", "Warp"),
            ("ghostty", "Ghostty", "Ghostty"),
            ("hyper", "Hyper", "Hyper"),
            ("tabby", "Tabby", "Tabby"),
            ("wezterm", "WezTerm", "WezTerm"),
            ("alacritty", "Alacritty", "Alacritty"),
            ("kitty", "Kitty", "kitty"),
        ];
        for (id, app, label) in apps {
            if detect_app(app) {
                out.push(TerminalInfo {
                    id: id.to_string(),
                    name: label.to_string(),
                });
            }
        }
        if !out.iter().any(|t| t.id == "alacritty") && detect_bin("alacritty") {
            out.push(TerminalInfo {
                id: "alacritty".into(),
                name: "Alacritty".into(),
            });
        }
        if !out.iter().any(|t| t.id == "kitty") && detect_bin("kitty") {
            out.push(TerminalInfo {
                id: "kitty".into(),
                name: "kitty".into(),
            });
        }
    }

    #[cfg(target_os = "linux")]
    {
        let bins = [
            ("gnome-terminal", "GNOME Terminal"),
            ("konsole", "Konsole"),
            ("xfce4-terminal", "XFCE Terminal"),
            ("alacritty", "Alacritty"),
            ("kitty", "kitty"),
            ("wezterm", "WezTerm"),
            ("ghostty", "Ghostty"),
            ("tabby", "Tabby"),
            ("wave", "Wave"),
            ("xterm", "xterm"),
            ("x-terminal-emulator", "Default"),
        ];
        for (bin, label) in bins {
            if out.iter().any(|t| t.id == bin) {
                continue;
            }
            if detect_bin(bin) {
                out.push(TerminalInfo {
                    id: bin.into(),
                    name: label.into(),
                });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        out.push(TerminalInfo {
            id: "cmd".into(),
            name: "Command Prompt".into(),
        });
        if detect_bin("pwsh") {
            out.push(TerminalInfo {
                id: "pwsh".into(),
                name: "PowerShell".into(),
            });
        }
        if detect_bin("wt") {
            out.push(TerminalInfo {
                id: "wt".into(),
                name: "Windows Terminal".into(),
            });
        }
    }

    out
}

#[cfg(target_os = "macos")]
fn launch_macos_terminal(id: &str, path: &str) -> Result<(), String> {
    use std::process::Command;
    let map = [
        ("terminal", "Terminal"),
        ("iterm", "iTerm"),
        ("warp", "Warp"),
        ("ghostty", "Ghostty"),
        ("hyper", "Hyper"),
        ("tabby", "Tabby"),
        ("wezterm", "WezTerm"),
        ("alacritty", "Alacritty"),
        ("kitty", "Kitty"),
        ("wave", "Wave"),
    ];
    if let Some(&(_, app)) = map.iter().find(|(k, _)| *k == id) {
        return Command::new("open")
            .args(["-a", app, path])
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string());
    }
    if id == "alacritty" {
        return Command::new("alacritty")
            .args(["--working-directory", path])
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string());
    }
    if id == "kitty" {
        return Command::new("kitty")
            .arg("--directory")
            .arg(path)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string());
    }
    Err(format!("Unknown terminal: {}", id))
}

#[tauri::command]
fn open_terminal(path: String, terminal_id: Option<String>) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "macos")]
    {
        let id = terminal_id.unwrap_or_else(|| "terminal".to_string());
        return launch_macos_terminal(&id, &path);
    }

    #[cfg(target_os = "linux")]
    {
        let id = terminal_id.unwrap_or_else(|| "x-terminal-emulator".to_string());
        if Command::new(&id)
            .arg("--working-directory")
            .arg(&path)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }
        Command::new(&id)
            .current_dir(&path)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    #[cfg(target_os = "windows")]
    {
        let id = terminal_id.unwrap_or_else(|| "cmd".to_string());
        match id.as_str() {
            "wt" => Command::new("wt")
                .args(["-d", &path])
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string()),
            "pwsh" => Command::new("pwsh")
                .args(["-NoExit", "-Command", &format!("Set-Location '{}'", path)])
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string()),
            _ => Command::new("cmd")
                .args(["/C", "start", "cmd", "/K", &format!("cd /d {}", path)])
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string()),
        }
    }
}

fn external_navigation_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::<R>::new("external-navigation")
        .on_navigation(|webview, url| {
            let is_internal_host = matches!(
                url.host_str(),
                Some("localhost") | Some("127.0.0.1") | Some("tauri.localhost") | Some("::1")
            );

            let is_internal = url.scheme() == "tauri" || is_internal_host;

            if is_internal {
                return true;
            }

            let is_external_link = matches!(url.scheme(), "http" | "https" | "mailto" | "tel");

            if is_external_link {
                log::info!("opening external link in system browser: {}", url);
                let _ = webview.opener().open_url(url.as_str(), None::<&str>);
                return false;
            }

            true
        })
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(external_navigation_plugin())
        .setup(|app| {
            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Arbor")
                .inner_size(1400.0, 700.0)
                .center()
                .visible(false)
                .hidden_title(true);

            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

            let window = win_builder.build().unwrap();

            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::{NSColor, NSWindow};
                use cocoa::base::{id, nil};

                let ns_window = window.ns_window().unwrap() as id;
                unsafe {
                    let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                        nil,
                        10.0 / 255.0,
                        16.0 / 255.0,
                        14.0 / 255.0,
                        1.0,
                    );
                    ns_window.setBackgroundColor_(bg_color);
                }
            }

            Ok(())
        })
        .manage(SearchIndex::default())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            get_home_dir,
            open_file,
            search_files,
            index_path,
            clear_search_index,
            create_dir,
            create_file,
            rename_entry,
            delete_entry,
            copy_entry,
            move_entry,
            open_terminal,
            list_terminals
        ])
        .on_page_load(|webview, payload| {
            if webview.label() == "main" && matches!(payload.event(), PageLoadEvent::Finished) {
                log::info!("main webview finished loading");
                let _ = webview.window().show();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
