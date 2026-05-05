use std::path::PathBuf;

use async_trait::async_trait;
use tokio::fs;
use uuid::Uuid;

use crate::domain::environment::Environment;
use crate::ports::EnvironmentRepository;

pub struct FsEnvironmentRepository {
    dir: PathBuf,
}

impl FsEnvironmentRepository {
    pub fn new(dir: PathBuf) -> Self {
        Self { dir }
    }

    fn file_path(&self, id: Uuid) -> PathBuf {
        self.dir.join(format!("{}.json", id))
    }

    async fn ensure_dir(&self) -> anyhow::Result<()> {
        fs::create_dir_all(&self.dir).await?;
        Ok(())
    }
}

#[async_trait]
impl EnvironmentRepository for FsEnvironmentRepository {
    async fn list(&self) -> anyhow::Result<Vec<Environment>> {
        self.ensure_dir().await?;
        let mut entries = fs::read_dir(&self.dir).await?;
        let mut out = Vec::new();
        while let Some(entry) = entries.next_entry().await? {
            if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                let bytes = fs::read(entry.path()).await?;
                if let Ok(e) = serde_json::from_slice::<Environment>(&bytes) {
                    out.push(e);
                }
            }
        }
        Ok(out)
    }

    async fn get(&self, id: Uuid) -> anyhow::Result<Option<Environment>> {
        self.ensure_dir().await?;
        let path = self.file_path(id);
        if !path.exists() {
            return Ok(None);
        }
        let bytes = fs::read(path).await?;
        Ok(Some(serde_json::from_slice(&bytes)?))
    }

    async fn save(&self, env: &Environment) -> anyhow::Result<()> {
        self.ensure_dir().await?;
        let json = serde_json::to_vec_pretty(env)?;
        fs::write(self.file_path(env.id), json).await?;
        Ok(())
    }

    async fn delete(&self, id: Uuid) -> anyhow::Result<()> {
        let path = self.file_path(id);
        if path.exists() {
            fs::remove_file(path).await?;
        }
        Ok(())
    }
}
