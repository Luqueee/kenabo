use std::path::PathBuf;

use tauri::{AppHandle, Manager};

pub struct DataPaths {
    pub root: PathBuf,
}

impl DataPaths {
    pub fn from_app(app: &AppHandle) -> anyhow::Result<Self> {
        let root = app.path().app_data_dir()?;
        Ok(Self { root })
    }

    pub fn collections_dir(&self) -> PathBuf {
        self.root.join("collections")
    }

    pub fn environments_dir(&self) -> PathBuf {
        self.root.join("environments")
    }
}
