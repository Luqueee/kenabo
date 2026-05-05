use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{AuthScheme, HeaderMap, HttpMethod, RequestBody};
use crate::domain::error::{DomainError, DomainResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequest {
    pub id: Uuid,
    pub name: String,
    pub method: HttpMethod,
    pub url: String,
    #[serde(default)]
    pub headers: HeaderMap,
    #[serde(default)]
    pub query: Vec<QueryParam>,
    #[serde(default)]
    pub body: RequestBody,
    #[serde(default)]
    pub auth: AuthScheme,
    #[serde(default)]
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryParam {
    pub name: String,
    pub value: String,
    #[serde(default = "crate::domain::http::body::default_true")]
    pub enabled: bool,
}

impl HttpRequest {
    pub fn new(name: impl Into<String>, method: HttpMethod, url: impl Into<String>) -> DomainResult<Self> {
        let url = url.into();
        if url.trim().is_empty() {
            return Err(DomainError::InvalidUrl("empty url".into()));
        }
        Ok(Self {
            id: Uuid::new_v4(),
            name: name.into(),
            method,
            url,
            headers: HeaderMap::new(),
            query: Vec::new(),
            body: RequestBody::None,
            auth: AuthScheme::None,
            timeout_ms: None,
        })
    }
}
