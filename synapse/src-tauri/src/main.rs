// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalShortcutManager, Manager};
use tracing::{info, error, Level};
use tracing_subscriber::FmtSubscriber;
mod settings;
use settings::{save_settings, load_settings};

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
            let window = match app.get_window("main") {
                Some(w) => w,
                None => {
                    error!("Main window not found");
                    return Ok(());
                }
            };
            if let Err(e) = window.hide() {
                error!("Error hiding window: {:?}", e);
            }

            let mut shortcut = app.global_shortcut_manager();
            let shortcut_window = window.clone();

            // Register global shortcut
            info!("Registering global shortcut");
            shortcut.register("Shift+Command+Space", move || {
                match shortcut_window.is_visible() {
                    Ok(true) => {
                        info!("Hiding window");
                        if let Err(e) = shortcut_window.hide() {
                            error!("Error hiding window: {:?}", e);
                        }
                    },
                    Ok(false) => {
                        info!("Showing window");
                        if let Err(e) = shortcut_window.show() {
                            error!("Error showing window: {:?}", e);
                        }
                        if let Ok(pos) = shortcut_window.outer_position() {
                            if let Err(e) = shortcut_window.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition { x: pos.x, y: 20 }
                            )) {
                                error!("Error setting window position: {:?}", e);
                            }
                        } else {
                            error!("Could not retrieve window position");
                        }
                        if let Err(e) = shortcut_window.set_focus() {
                            error!("Error focusing window: {:?}", e);
                        }
                        if let Err(e) = shortcut_window.eval("document.querySelector('input')?.focus()") {
                            error!("Error evaluating JS to focus input: {:?}", e);
                        }
                    },
                    Err(e) => {
                        error!("Error retrieving window visibility: {:?}", e);
                    }
                }
            }).expect("Failed to register global shortcut");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
