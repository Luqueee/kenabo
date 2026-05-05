mod domain;
mod ports;
mod application;
mod infrastructure;

use std::sync::Arc;

use tauri::webview::PageLoadEvent;
use tauri::{Manager, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_log::{Target, TargetKind};

use application::collections::CollectionService;
use application::environments::EnvironmentService;
use application::execute_request::ExecuteRequestUseCase;
use infrastructure::http_client::ReqwestHttpClient;
use infrastructure::persistence::paths::DataPaths;
use infrastructure::persistence::{FsCollectionRepository, FsEnvironmentRepository};
use infrastructure::tauri::commands;
use infrastructure::tauri::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let paths = DataPaths::from_app(app.handle())?;
            std::fs::create_dir_all(&paths.root).ok();

            let http_client = Arc::new(ReqwestHttpClient::new()?);
            let collection_repo =
                Arc::new(FsCollectionRepository::new(paths.collections_dir()));
            let environment_repo =
                Arc::new(FsEnvironmentRepository::new(paths.environments_dir()));

            let execute_request = Arc::new(ExecuteRequestUseCase::new(http_client));
            let collections = Arc::new(CollectionService::new(collection_repo));
            let environments = Arc::new(EnvironmentService::new(environment_repo));

            app.manage(AppState {
                execute_request,
                collections,
                environments,
            });

            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Kenabo")
                .inner_size(1400.0, 800.0)
                .center()
                .visible(false)
                .hidden_title(true);

            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

            let window = win_builder.build().unwrap();

            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::{NSColor, NSWindow};
                use cocoa::base::{id, nil};

                let ns_window = window.ns_window().unwrap() as id;
                unsafe {
                    let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                        nil,
                        10.0 / 255.0,
                        16.0 / 255.0,
                        14.0 / 255.0,
                        1.0,
                    );
                    ns_window.setBackgroundColor_(bg_color);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::execute_request,
            commands::list_collections,
            commands::create_collection,
            commands::save_collection,
            commands::delete_collection,
            commands::list_environments,
            commands::create_environment,
            commands::save_environment,
            commands::delete_environment,
        ])
        .on_page_load(|webview, payload| {
            if webview.label() == "main" && matches!(payload.event(), PageLoadEvent::Finished) {
                log::info!("main webview finished loading");
                let _ = webview.window().show();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
