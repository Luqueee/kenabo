use std::time::{Duration, Instant};

use async_trait::async_trait;
use base64_encode_self::encode_b64;
use reqwest::{Client, Method};

use crate::domain::http::auth::{ApiKeyPlacement, AuthScheme};
use crate::domain::http::body::{MultipartField, RequestBody};
use crate::domain::http::{HttpRequest, HttpResponse};
use crate::domain::http::response::ResponseBody;
use crate::ports::HttpClientPort;

pub struct ReqwestHttpClient {
    client: Client,
}

impl ReqwestHttpClient {
    pub fn new() -> anyhow::Result<Self> {
        let client = Client::builder()
            .user_agent("kenabo/0.1")
            .build()?;
        Ok(Self { client })
    }
}

#[async_trait]
impl HttpClientPort for ReqwestHttpClient {
    async fn send(&self, request: &HttpRequest) -> anyhow::Result<HttpResponse> {
        let method = Method::from_bytes(request.method.as_str().as_bytes())?;
        let mut builder = self.client.request(method, &request.url);

        let enabled_query: Vec<(&str, &str)> = request
            .query
            .iter()
            .filter(|q| q.enabled)
            .map(|q| (q.name.as_str(), q.value.as_str()))
            .collect();
        if !enabled_query.is_empty() {
            builder = builder.query(&enabled_query);
        }

        for (name, value) in request.headers.enabled() {
            builder = builder.header(name, value);
        }

        match &request.auth {
            AuthScheme::None => {}
            AuthScheme::Basic { username, password } => {
                builder = builder.basic_auth(username, Some(password));
            }
            AuthScheme::Bearer { token } => {
                builder = builder.bearer_auth(token);
            }
            AuthScheme::ApiKey { key, value, placement } => match placement {
                ApiKeyPlacement::Header => builder = builder.header(key, value),
                ApiKeyPlacement::Query => builder = builder.query(&[(key, value)]),
            },
        }

        builder = match &request.body {
            RequestBody::None => builder,
            RequestBody::Text { content } => builder.body(content.clone()),
            RequestBody::Json { content } => builder
                .header("content-type", "application/json")
                .body(content.clone()),
            RequestBody::Form { fields } => {
                let pairs: Vec<(&str, &str)> = fields
                    .iter()
                    .filter(|f| f.enabled)
                    .map(|f| (f.name.as_str(), f.value.as_str()))
                    .collect();
                builder.form(&pairs)
            }
            RequestBody::Multipart { fields } => {
                let mut form = reqwest::multipart::Form::new();
                for f in fields {
                    match f {
                        MultipartField::Text { name, value, enabled } if *enabled => {
                            form = form.text(name.clone(), value.clone());
                        }
                        MultipartField::File { name, path, enabled } if *enabled => {
                            let bytes = tokio::fs::read(path).await?;
                            let part = reqwest::multipart::Part::bytes(bytes)
                                .file_name(path.clone());
                            form = form.part(name.clone(), part);
                        }
                        _ => {}
                    }
                }
                builder.multipart(form)
            }
            RequestBody::Raw { content_type, content } => builder
                .header("content-type", content_type)
                .body(content.clone()),
        };

        if let Some(ms) = request.timeout_ms {
            builder = builder.timeout(Duration::from_millis(ms));
        }

        let started = Instant::now();
        let response = builder.send().await?;
        let status = response.status();
        let status_text = status
            .canonical_reason()
            .unwrap_or("")
            .to_string();
        let headers: Vec<(String, String)> = response
            .headers()
            .iter()
            .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or("").to_string()))
            .collect();
        let bytes = response.bytes().await?;
        let elapsed_ms = started.elapsed().as_millis();
        let size_bytes = bytes.len();

        let body = if bytes.is_empty() {
            ResponseBody::Empty
        } else {
            match std::str::from_utf8(&bytes) {
                Ok(s) => ResponseBody::Text { content: s.to_string() },
                Err(_) => ResponseBody::Binary { base64: encode_b64(&bytes) },
            }
        };

        Ok(HttpResponse {
            status: status.as_u16(),
            status_text,
            headers,
            body,
            elapsed_ms,
            size_bytes,
        })
    }
}

mod base64_encode_self {
    const ALPHABET: &[u8; 64] =
        b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    pub fn encode_b64(input: &[u8]) -> String {
        let mut out = String::with_capacity((input.len() + 2) / 3 * 4);
        let mut i = 0;
        while i + 3 <= input.len() {
            let n = ((input[i] as u32) << 16) | ((input[i + 1] as u32) << 8) | (input[i + 2] as u32);
            out.push(ALPHABET[((n >> 18) & 63) as usize] as char);
            out.push(ALPHABET[((n >> 12) & 63) as usize] as char);
            out.push(ALPHABET[((n >> 6) & 63) as usize] as char);
            out.push(ALPHABET[(n & 63) as usize] as char);
            i += 3;
        }
        let rem = input.len() - i;
        if rem == 1 {
            let n = (input[i] as u32) << 16;
            out.push(ALPHABET[((n >> 18) & 63) as usize] as char);
            out.push(ALPHABET[((n >> 12) & 63) as usize] as char);
            out.push('=');
            out.push('=');
        } else if rem == 2 {
            let n = ((input[i] as u32) << 16) | ((input[i + 1] as u32) << 8);
            out.push(ALPHABET[((n >> 18) & 63) as usize] as char);
            out.push(ALPHABET[((n >> 12) & 63) as usize] as char);
            out.push(ALPHABET[((n >> 6) & 63) as usize] as char);
            out.push('=');
        }
        out
    }
}
