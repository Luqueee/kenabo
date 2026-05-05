use tauri::State;
use uuid::Uuid;

use crate::domain::collection::Collection;
use crate::domain::environment::Environment;
use crate::domain::http::{HttpRequest, HttpResponse};

use super::state::AppState;

fn err_string<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

#[tauri::command]
pub async fn execute_request(
    state: State<'_, AppState>,
    request: HttpRequest,
    environment_id: Option<Uuid>,
) -> Result<HttpResponse, String> {
    let env = if let Some(id) = environment_id {
        state.environments.get(id).await.map_err(err_string)?
    } else {
        None
    };
    state
        .execute_request
        .execute(request, env.as_ref())
        .await
        .map_err(err_string)
}

#[tauri::command]
pub async fn list_collections(state: State<'_, AppState>) -> Result<Vec<Collection>, String> {
    state.collections.list().await.map_err(err_string)
}

#[tauri::command]
pub async fn create_collection(
    state: State<'_, AppState>,
    name: String,
) -> Result<Collection, String> {
    state.collections.create(name).await.map_err(err_string)
}

#[tauri::command]
pub async fn save_collection(
    state: State<'_, AppState>,
    collection: Collection,
) -> Result<(), String> {
    state
        .collections
        .save(&collection)
        .await
        .map_err(err_string)
}

#[tauri::command]
pub async fn delete_collection(state: State<'_, AppState>, id: Uuid) -> Result<(), String> {
    state.collections.delete(id).await.map_err(err_string)
}

#[tauri::command]
pub async fn list_environments(state: State<'_, AppState>) -> Result<Vec<Environment>, String> {
    state.environments.list().await.map_err(err_string)
}

#[tauri::command]
pub async fn create_environment(
    state: State<'_, AppState>,
    name: String,
) -> Result<Environment, String> {
    state.environments.create(name).await.map_err(err_string)
}

#[tauri::command]
pub async fn save_environment(
    state: State<'_, AppState>,
    environment: Environment,
) -> Result<(), String> {
    state
        .environments
        .save(&environment)
        .await
        .map_err(err_string)
}

#[tauri::command]
pub async fn delete_environment(state: State<'_, AppState>, id: Uuid) -> Result<(), String> {
    state.environments.delete(id).await.map_err(err_string)
}
