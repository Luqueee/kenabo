use std::sync::Arc;
use uuid::Uuid;

use crate::domain::environment::Environment;
use crate::ports::EnvironmentRepository;

pub struct EnvironmentService {
    repo: Arc<dyn EnvironmentRepository>,
}

impl EnvironmentService {
    pub fn new(repo: Arc<dyn EnvironmentRepository>) -> Self {
        Self { repo }
    }

    pub async fn list(&self) -> anyhow::Result<Vec<Environment>> {
        self.repo.list().await
    }

    pub async fn get(&self, id: Uuid) -> anyhow::Result<Option<Environment>> {
        self.repo.get(id).await
    }

    pub async fn create(&self, name: String) -> anyhow::Result<Environment> {
        let env = Environment::new(name);
        self.repo.save(&env).await?;
        Ok(env)
    }

    pub async fn save(&self, env: &Environment) -> anyhow::Result<()> {
        self.repo.save(env).await
    }

    pub async fn delete(&self, id: Uuid) -> anyhow::Result<()> {
        self.repo.delete(id).await
    }
}
