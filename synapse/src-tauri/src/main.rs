// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.hide().unwrap();

                // Create shortcut
                let shortcut = Shortcut::new(Some(Modifiers::SHIFT | Modifiers::META), Code::Space);
                let shortcut_window = window.clone();

                // Register handler
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, current_shortcut, event| {
                            if current_shortcut == &shortcut {
                                match event.state() {
                                    ShortcutState::Pressed => {
                                        if shortcut_window.is_visible().unwrap() {
                                            shortcut_window.hide().unwrap();
                                        } else {
                                            shortcut_window.show().unwrap();
                                            shortcut_window.set_focus().unwrap();
                                        }
                                    }
                                    ShortcutState::Released => {
                                        // Future release event handling here
                                        #[cfg(debug_assertions)]
                                        println!("Shortcut released");
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                // Register shortcut
                app.global_shortcut().register(shortcut)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
