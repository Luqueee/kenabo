use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::environment::Environment;

#[async_trait]
pub trait EnvironmentRepository: Send + Sync {
    async fn list(&self) -> anyhow::Result<Vec<Environment>>;
    async fn get(&self, id: Uuid) -> anyhow::Result<Option<Environment>>;
    async fn save(&self, env: &Environment) -> anyhow::Result<()>;
    async fn delete(&self, id: Uuid) -> anyhow::Result<()>;
}
