use keyring::Entry;
use serde::Serialize;

const SERVICE_NAME: &str = "synapse";

#[derive(Debug, thiserror::Error, Serialize)]
pub enum SettingsError {
    #[error("Keychain error: {0}")]
    KeychainError(String),
    #[error("JSON error: {0}")]
    JsonError(String),
}

#[tauri::command]
pub fn save_settings(contents: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "app_settings")
        .map_err(|e| e.to_string())?;
    entry.set_password(&contents)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_settings() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, "app_settings")
        .map_err(|e| e.to_string())?;
    
    match entry.get_password() {
        Ok(settings) => Ok(settings),
        Err(_) => Ok("{}".to_string())
    }
}

#[tauri::command]
pub fn save_api_key(provider: String, key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &format!("api_key_{}", provider))
        .map_err(|e| e.to_string())?;
    entry.set_password(&key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_api_key(provider: String) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, &format!("api_key_{}", provider))
        .map_err(|e| e.to_string())?;
    
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(_) => Ok(None)
    }
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &format!("api_key_{}", provider))
        .map_err(|e| e.to_string())?;
    
    let _ = entry.delete_password();
    Ok(())
} 