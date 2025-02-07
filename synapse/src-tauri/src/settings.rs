use keyring::Entry;
use serde::{Serialize, Deserialize};
use std::sync::Once;

// Constants for keychain access
const SERVICE_NAME: &str = "com.synapse.app";
const SETTINGS_KEY: &str = "app_settings";
static INIT: Once = Once::new();

// Initialize keychain access once
fn init_keychain() -> Result<Entry, String> {
    let entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
        .map_err(|e| format!("Failed to initialize keychain: {}", e))?;
    Ok(entry)
}

#[derive(Debug, thiserror::Error, Serialize)]
pub enum SettingsError {
    #[error("Keychain error: {0}")]
    KeychainError(String),
    #[error("JSON error: {0}")]
    JsonError(String),
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    selected_model: String,
    default_provider: String,
    openai: OpenAISettings,
    anthropic: AnthropicSettings,
    safety: SafetySettings,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenAISettings {
    api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    org_id: Option<String>,
    default_temperature: f32,
    max_tokens: i32,
    system_prompt: String,
    use_moderation: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnthropicSettings {
    api_key: String,
    max_tokens: i32,
    system_prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    stop_sequences: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafetySettings {
    content_filter_level: String,
    enabled_capabilities: EnabledCapabilities,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnabledCapabilities {
    code_generation: bool,
    external_links: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct StoredSettings {
    settings: Settings,
    api_keys: ApiKeys,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiKeys {
    openai: Option<String>,
    anthropic: Option<String>,
}

impl Default for StoredSettings {
    fn default() -> Self {
        Self {
            settings: Settings {
                selected_model: "gpt-4-turbo-preview".to_string(),
                default_provider: "openai".to_string(),
                openai: OpenAISettings {
                    api_key: String::new(),
                    org_id: None,
                    default_temperature: 0.7,
                    max_tokens: 4096,
                    system_prompt: String::new(),
                    use_moderation: true,
                },
                anthropic: AnthropicSettings {
                    api_key: String::new(),
                    max_tokens: 4096,
                    system_prompt: String::new(),
                    stop_sequences: None,
                },
                safety: SafetySettings {
                    content_filter_level: "moderate".to_string(),
                    enabled_capabilities: EnabledCapabilities {
                        code_generation: true,
                        external_links: true,
                    },
                },
            },
            api_keys: ApiKeys {
                openai: None,
                anthropic: None,
            },
        }
    }
}

#[tauri::command]
pub fn save_settings(contents: String) -> Result<(), String> {
    // Initialize keychain access if not already done
    INIT.call_once(|| {
        let _ = init_keychain();
    });

    let entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))?;

    // Parse the incoming settings
    let settings: Settings = serde_json::from_str(&contents)
        .map_err(|e| format!("Invalid settings format: {}", e))?;

    // Create StoredSettings from the incoming settings
    let stored_settings = StoredSettings {
        api_keys: ApiKeys {
            openai: if !settings.openai.api_key.is_empty() {
                Some(settings.openai.api_key.clone())
            } else {
                None
            },
            anthropic: if !settings.anthropic.api_key.is_empty() {
                Some(settings.anthropic.api_key.clone())
            } else {
                None
            },
        },
        settings: Settings {
            selected_model: settings.selected_model,
            default_provider: settings.default_provider,
            openai: OpenAISettings {
                api_key: String::new(), // Clear API key from main settings
                org_id: settings.openai.org_id,
                default_temperature: settings.openai.default_temperature,
                max_tokens: settings.openai.max_tokens,
                system_prompt: settings.openai.system_prompt,
                use_moderation: settings.openai.use_moderation,
            },
            anthropic: AnthropicSettings {
                api_key: String::new(), // Clear API key from main settings
                max_tokens: settings.anthropic.max_tokens,
                system_prompt: settings.anthropic.system_prompt,
                stop_sequences: settings.anthropic.stop_sequences,
            },
            safety: settings.safety,
        },
    };

    // Save everything in a single keychain entry
    let json = serde_json::to_string(&stored_settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    entry.set_password(&json)
        .map_err(|e| format!("Failed to save to keychain: {}", e))
}

#[tauri::command]
pub fn load_settings() -> Result<String, String> {
    // Initialize keychain access if not already done
    INIT.call_once(|| {
        let _ = init_keychain();
    });

    let entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))?;

    match entry.get_password() {
        Ok(stored_json) => {
            let stored_settings: StoredSettings = serde_json::from_str(&stored_json)
                .unwrap_or_default();

            // Merge API keys back into the settings
            let mut settings = stored_settings.settings;
            if let Some(openai_key) = stored_settings.api_keys.openai {
                settings.openai.api_key = openai_key;
            }
            if let Some(anthropic_key) = stored_settings.api_keys.anthropic {
                settings.anthropic.api_key = anthropic_key;
            }

            serde_json::to_string(&settings)
                .map_err(|e| format!("Failed to serialize settings: {}", e))
        }
        Err(_) => Ok(serde_json::to_string(&StoredSettings::default().settings)
            .unwrap_or_else(|_| "{}".to_string()))
    }
}

// These commands are now deprecated as we handle API keys in the main settings
#[tauri::command]
pub fn save_api_key(_provider: String, _key: String) -> Result<(), String> {
    Ok(()) // No-op as we handle this in save_settings now
}

#[tauri::command]
pub fn load_api_key(_provider: String) -> Result<Option<String>, String> {
    Ok(None) // No-op as we handle this in load_settings now
}

#[tauri::command]
pub fn delete_api_key(_provider: String) -> Result<(), String> {
    Ok(()) // No-op as we handle this in save_settings now
} 