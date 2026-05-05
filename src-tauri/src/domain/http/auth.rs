use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum AuthScheme {
    None,
    Basic { username: String, password: String },
    Bearer { token: String },
    ApiKey { key: String, value: String, placement: ApiKeyPlacement },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ApiKeyPlacement {
    Header,
    Query,
}

impl Default for AuthScheme {
    fn default() -> Self {
        Self::None
    }
}
