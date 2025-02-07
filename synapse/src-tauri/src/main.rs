// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalShortcutManager, Manager};
mod settings;
use settings::{save_settings, load_settings, save_api_key, load_api_key, delete_api_key};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.hide().unwrap();

            let mut shortcut = app.global_shortcut_manager();
            let shortcut_window = window.clone();

            // Register global shortcut
            shortcut.register("Shift+Command+Space", move || {
                if shortcut_window.is_visible().unwrap() {
                    shortcut_window.hide().unwrap();
                } else {
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
