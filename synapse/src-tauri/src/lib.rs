// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
pub mod settings;
use settings::{save_settings, load_settings, save_api_key, load_api_key, delete_api_key};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            save_settings,
            load_settings,
            save_api_key,
            load_api_key,
            delete_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
