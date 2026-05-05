use std::path::PathBuf;

use async_trait::async_trait;
use tokio::fs;
use uuid::Uuid;

use crate::domain::collection::Collection;
use crate::ports::CollectionRepository;

pub struct FsCollectionRepository {
    dir: PathBuf,
}

impl FsCollectionRepository {
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
impl CollectionRepository for FsCollectionRepository {
    async fn list(&self) -> anyhow::Result<Vec<Collection>> {
        self.ensure_dir().await?;
        let mut entries = fs::read_dir(&self.dir).await?;
        let mut out = Vec::new();
        while let Some(entry) = entries.next_entry().await? {
            if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                let bytes = fs::read(entry.path()).await?;
                if let Ok(c) = serde_json::from_slice::<Collection>(&bytes) {
                    out.push(c);
                }
            }
        }
        Ok(out)
    }

    async fn get(&self, id: Uuid) -> anyhow::Result<Option<Collection>> {
        self.ensure_dir().await?;
        let path = self.file_path(id);
        if !path.exists() {
            return Ok(None);
        }
        let bytes = fs::read(path).await?;
        Ok(Some(serde_json::from_slice(&bytes)?))
    }

    async fn save(&self, collection: &Collection) -> anyhow::Result<()> {
        self.ensure_dir().await?;
        let json = serde_json::to_vec_pretty(collection)?;
        fs::write(self.file_path(collection.id), json).await?;
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
