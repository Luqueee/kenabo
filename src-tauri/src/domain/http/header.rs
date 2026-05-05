use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(transparent)]
pub struct HeaderMap(pub Vec<HeaderEntry>);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeaderEntry {
    pub name: String,
    pub value: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool {
    true
}

impl HeaderMap {
    pub fn new() -> Self {
        Self(Vec::new())
    }

    pub fn enabled(&self) -> impl Iterator<Item = (&str, &str)> {
        self.0
            .iter()
            .filter(|h| h.enabled)
            .map(|h| (h.name.as_str(), h.value.as_str()))
    }
}
