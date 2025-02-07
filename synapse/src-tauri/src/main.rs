// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalShortcutManager, Manager};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;
mod settings;
use settings::{save_settings, load_settings, save_api_key, load_api_key, delete_api_key};

fn main() {
    // Initialize logging
    FmtSubscriber::builder()
        .with_max_level(Level::DEBUG)
        .with_target(false)
        .with_file(true)
        .with_line_number(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_ansi(true)
        .pretty()
        .init();

    info!("Starting Synapse application");

    tauri::Builder::default()
        .setup(|app| {
            info!("Setting up Tauri application");
            let window = app.get_window("main").unwrap();
            window.hide().unwrap();

            let mut shortcut = app.global_shortcut_manager();
            let shortcut_window = window.clone();

            // Register global shortcut
            info!("Registering global shortcut");
            shortcut.register("Shift+Command+Space", move || {
                if shortcut_window.is_visible().unwrap() {
                    info!("Hiding window");
                    shortcut_window.hide().unwrap();
                } else {
                    info!("Showing window");
                    shortcut_window.show().unwrap();
                    // Position window at top of screen
                    shortcut_window.set_position(tauri::Position::Physical(
                        tauri::PhysicalPosition { 
                            x: shortcut_window.outer_position().unwrap().x, 
                            y: 20 
                        }
                    )).unwrap();
                    shortcut_window.set_focus().unwrap();
                    let _ = shortcut_window.eval("document.querySelector('input')?.focus()");
                }
            }).expect("Failed to register global shortcut");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            save_api_key,
            load_api_key,
            delete_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
