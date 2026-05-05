use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub id: Uuid,
    pub name: String,
    pub variables: HashMap<String, EnvVar>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVar {
    pub value: String,
    #[serde(default)]
    pub secret: bool,
}

impl Environment {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            variables: HashMap::new(),
        }
    }

    pub fn resolve(&self, template: &str) -> String {
        let mut out = template.to_string();
        for (k, v) in &self.variables {
            let pat = format!("{{{{{}}}}}", k);
            out = out.replace(&pat, &v.value);
        }
        out
    }
}
