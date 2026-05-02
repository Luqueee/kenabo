use std::path::Path;

use serde::Serialize;

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
pub fn list_terminals() -> Vec<TerminalInfo> {
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
pub fn open_terminal(path: String, terminal_id: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let id = terminal_id.unwrap_or_else(|| "terminal".to_string());
        return launch_macos_terminal(&id, &path);
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
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
        use std::process::Command;
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
