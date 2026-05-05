use std::sync::Arc;

use crate::application::collections::CollectionService;
use crate::application::environments::EnvironmentService;
use crate::application::execute_request::ExecuteRequestUseCase;

pub struct AppState {
    pub execute_request: Arc<ExecuteRequestUseCase>,
    pub collections: Arc<CollectionService>,
    pub environments: Arc<EnvironmentService>,
}
