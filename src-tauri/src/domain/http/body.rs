use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum RequestBody {
    None,
    Text { content: String },
    Json { content: String },
    Form { fields: Vec<FormField> },
    Multipart { fields: Vec<MultipartField> },
    Raw { #[serde(rename = "content-type")] content_type: String, content: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormField {
    pub name: String,
    pub value: String,
    #[serde(default = "crate::domain::http::body::default_true")]
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum MultipartField {
    Text { name: String, value: String, enabled: bool },
    File { name: String, path: String, enabled: bool },
}

pub(crate) fn default_true() -> bool {
    true
}

impl Default for RequestBody {
    fn default() -> Self {
        Self::None
    }
}
