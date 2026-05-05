use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::http::HttpRequest;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: Uuid,
    pub name: String,
    pub root: Folder,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Folder {
    pub id: Uuid,
    pub name: String,
    #[serde(default)]
    pub folders: Vec<Folder>,
    #[serde(default)]
    pub requests: Vec<HttpRequest>,
}

impl Collection {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            root: Folder {
                id: Uuid::new_v4(),
                name: "root".into(),
                folders: Vec::new(),
                requests: Vec::new(),
            },
        }
    }
}
