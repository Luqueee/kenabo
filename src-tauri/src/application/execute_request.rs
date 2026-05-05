use std::sync::Arc;

use crate::domain::environment::Environment;
use crate::domain::http::{HttpRequest, HttpResponse};
use crate::ports::HttpClientPort;

pub struct ExecuteRequestUseCase {
    client: Arc<dyn HttpClientPort>,
}

impl ExecuteRequestUseCase {
    pub fn new(client: Arc<dyn HttpClientPort>) -> Self {
        Self { client }
    }

    pub async fn execute(
        &self,
        mut request: HttpRequest,
        environment: Option<&Environment>,
    ) -> anyhow::Result<HttpResponse> {
        if let Some(env) = environment {
            request.url = env.resolve(&request.url);
            for h in request.headers.0.iter_mut() {
                h.value = env.resolve(&h.value);
            }
            for q in request.query.iter_mut() {
                q.value = env.resolve(&q.value);
            }
        }
        self.client.send(&request).await
    }
}
