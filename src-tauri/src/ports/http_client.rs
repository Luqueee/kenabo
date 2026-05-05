use async_trait::async_trait;

use crate::domain::http::{HttpRequest, HttpResponse};

#[async_trait]
pub trait HttpClientPort: Send + Sync {
    async fn send(&self, request: &HttpRequest) -> anyhow::Result<HttpResponse>;
}
