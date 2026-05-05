use thiserror::Error;

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("invalid url: {0}")]
    InvalidUrl(String),
    #[error("invalid method: {0}")]
    InvalidMethod(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("validation: {0}")]
    Validation(String),
}

pub type DomainResult<T> = Result<T, DomainError>;
