use keyring::Entry;
use serde::{Serialize, Deserialize};
use std::sync::{Mutex, Once};
use tracing::{info, warn, error, debug};

// Constants for keychain access - using reverse domain name notation for macOS
const SERVICE_NAME: &str = "com.synapse.settings";
const SETTINGS_KEY: &str = "user-settings";

// Global keychain entry
static KEYCHAIN: Mutex<Option<Entry>> = Mutex::new(None);
static INIT: Once = Once::new();

// Initialize keychain access once
fn get_keychain() -> Result<Entry, String> {
    INIT.call_once(|| {
        // Create a single persistent entry for all settings
        if let Ok(entry) = Entry::new(SERVICE_NAME, SETTINGS_KEY) {
            let _ = KEYCHAIN.lock().unwrap().insert(entry);
        }
    });

    // Always return a new Entry with the same service name and key
    Entry::new(SERVICE_NAME, SETTINGS_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))
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
    debug!("Attempting to save settings");
    let entry = match get_keychain() {
        Ok(entry) => entry,
        Err(e) => {
            error!("Failed to get keychain entry: {}", e);
            return Err(e);
        }
    };

    // Parse the incoming settings
    let settings: Settings = match serde_json::from_str(&contents) {
        Ok(settings) => {
            debug!("Successfully parsed settings JSON");
            settings
        }
        Err(e) => {
            error!("Failed to parse settings JSON: {}", e);
            return Err(format!("Invalid settings format: {}", e));
        }
    };

    // Create StoredSettings from the incoming settings
    let stored_settings = StoredSettings {
        api_keys: ApiKeys {
            openai: if !settings.openai.api_key.is_empty() {
                debug!("Storing OpenAI API key");
                Some(settings.openai.api_key.clone())
            } else {
                debug!("No OpenAI API key provided");
                None
            },
            anthropic: if !settings.anthropic.api_key.is_empty() {
                debug!("Storing Anthropic API key");
                Some(settings.anthropic.api_key.clone())
            } else {
                debug!("No Anthropic API key provided");
                None
            },
        },
        settings: Settings {
            selected_model: settings.selected_model.clone(),
            default_provider: settings.default_provider.clone(),
            openai: OpenAISettings {
                api_key: String::new(), // Clear API key from main settings
                org_id: settings.openai.org_id.clone(),
                default_temperature: settings.openai.default_temperature,
                max_tokens: settings.openai.max_tokens,
                system_prompt: settings.openai.system_prompt.clone(),
                use_moderation: settings.openai.use_moderation,
            },
            anthropic: AnthropicSettings {
                api_key: String::new(), // Clear API key from main settings
                max_tokens: settings.anthropic.max_tokens,
                system_prompt: settings.anthropic.system_prompt.clone(),
                stop_sequences: settings.anthropic.stop_sequences.clone(),
            },
            safety: settings.safety,
        },
    };

    // Save everything in a single keychain entry
    let json = match serde_json::to_string(&stored_settings) {
        Ok(json) => {
            debug!("Successfully serialized settings to JSON");
            json
        }
        Err(e) => {
            error!("Failed to serialize settings to JSON: {}", e);
            return Err(format!("Failed to serialize settings: {}", e));
        }
    };

    match entry.set_password(&json) {
        Ok(_) => {
            info!("Successfully saved settings to keychain");
            Ok(())
        }
        Err(e) => {
            error!("Failed to save settings to keychain: {}", e);
            Err(format!("Failed to save to keychain: {}", e))
        }
    }
}

#[tauri::command]
pub fn load_settings() -> Result<String, String> {
    debug!("Attempting to load settings");
    let entry = match get_keychain() {
        Ok(entry) => entry,
        Err(e) => {
            error!("Failed to get keychain entry: {}", e);
            return Err(e);
        }
    };

    match entry.get_password() {
        Ok(stored_json) => {
            debug!("Successfully retrieved settings from keychain");
            let stored_settings = serde_json::from_str::<StoredSettings>(&stored_json).map_or_else(
                |e| {
                    warn!("Failed to parse stored settings, using defaults: {}", e);
                    StoredSettings::default()
                },
                |settings| {
                    debug!("Successfully parsed stored settings");
                    info!("API Keys state: OpenAI present: {}, Anthropic present: {}", 
                        settings.api_keys.openai.is_some(),
                        settings.api_keys.anthropic.is_some()
                    );
                    settings
                }
            );

            // Merge API keys back into the settings
            let mut settings = stored_settings.settings;
            if let Some(openai_key) = stored_settings.api_keys.openai {
                info!("Merging OpenAI API key (length: {})", openai_key.len());
                settings.openai.api_key = openai_key;
            } else {
                info!("No OpenAI API key to merge");
            }
            if let Some(anthropic_key) = stored_settings.api_keys.anthropic {
                info!("Merging Anthropic API key (length: {})", anthropic_key.len());
                settings.anthropic.api_key = anthropic_key;
            } else {
                info!("No Anthropic API key to merge");
            }

            match serde_json::to_string(&settings) {
                Ok(json) => {
                    info!("Successfully loaded and processed settings");
                    Ok(json)
                }
                Err(e) => {
                    error!("Failed to serialize processed settings: {}", e);
                    Err(format!("Failed to serialize settings: {}", e))
                }
            }
        }
        Err(e) => {
            warn!("No existing settings found, using defaults: {}", e);
            match serde_json::to_string(&StoredSettings::default().settings) {
                Ok(json) => Ok(json),
                Err(e) => {
                    error!("Failed to serialize default settings: {}", e);
                    Err(format!("Failed to serialize default settings: {}", e))
                }
            }
        }
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