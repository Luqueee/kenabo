use std::sync::Arc;
use uuid::Uuid;

use crate::domain::collection::Collection;
use crate::ports::CollectionRepository;

pub struct CollectionService {
    repo: Arc<dyn CollectionRepository>,
}

impl CollectionService {
    pub fn new(repo: Arc<dyn CollectionRepository>) -> Self {
        Self { repo }
    }

    pub async fn list(&self) -> anyhow::Result<Vec<Collection>> {
        self.repo.list().await
    }

    pub async fn create(&self, name: String) -> anyhow::Result<Collection> {
        let collection = Collection::new(name);
        self.repo.save(&collection).await?;
        Ok(collection)
    }

    pub async fn save(&self, collection: &Collection) -> anyhow::Result<()> {
        self.repo.save(collection).await
    }

    pub async fn delete(&self, id: Uuid) -> anyhow::Result<()> {
        self.repo.delete(id).await
    }
}
