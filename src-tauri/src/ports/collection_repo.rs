use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::collection::Collection;

#[async_trait]
pub trait CollectionRepository: Send + Sync {
    async fn list(&self) -> anyhow::Result<Vec<Collection>>;
    async fn get(&self, id: Uuid) -> anyhow::Result<Option<Collection>>;
    async fn save(&self, collection: &Collection) -> anyhow::Result<()>;
    async fn delete(&self, id: Uuid) -> anyhow::Result<()>;
}
