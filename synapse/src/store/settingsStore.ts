import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { Settings, DEFAULT_SETTINGS, Model, ModelProvider } from '../types/settings';

interface SettingsState extends Settings {
  isLoading: boolean;
  hasLoaded: boolean;
  setSettings: (settings: Partial<Settings>) => void;
  setModel: (model: Model) => void;
  setProvider: (provider: ModelProvider) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  validateApiKey: (provider: ModelProvider) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoading: false,
  hasLoaded: false,

  setSettings: (settings) => {
    set((state) => ({ ...state, ...settings }));
  },

  setModel: (model) => {
    set({ selectedModel: model });
  },

  setProvider: (provider) => {
    set({ defaultProvider: provider });
  },

  loadSettings: async () => {
    const state = get();
    // Skip loading if already loaded and not in a loading state
    if (state.hasLoaded && !state.isLoading) {
      return;
    }

    set({ isLoading: true });
    try {
      // Load settings using our Rust commands
      try {
        const contents = await invoke<string>('load_settings');
        if (contents) {
          const settings = JSON.parse(contents) as Partial<Settings>;
          console.log('Loaded settings:', {
            hasOpenAIKey: !!settings.openai?.apiKey,
            openAIKeyLength: settings.openai?.apiKey?.length,
            hasAnthropicKey: !!settings.anthropic?.apiKey,
            anthropicKeyLength: settings.anthropic?.apiKey?.length,
          });
          set((state) => ({ ...state, ...settings }));
        }
      } catch (error) {
        console.log('No existing settings found');
      }

      // Load API keys
      try {
        const openaiKey = await invoke<string | null>('load_api_key', { provider: 'openai' });
        const anthropicKey = await invoke<string | null>('load_api_key', { provider: 'anthropic' });
        
        set((state) => ({
          ...state,
          openai: {
            ...state.openai,
            ...(openaiKey ? { apiKey: openaiKey } : {})
          },
          anthropic: {
            ...state.anthropic,
            ...(anthropicKey ? { apiKey: anthropicKey } : {})
          }
        }));
      } catch (error) {
        console.log('No existing API keys found');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      set({ isLoading: false, hasLoaded: true });  // Set hasLoaded to true when done
    }
  },

  saveSettings: async () => {
    const state = get();
    set({ isLoading: true });
    try {
      // Save all settings including API keys
      const { isLoading, hasLoaded, setSettings, setModel, setProvider, loadSettings, saveSettings, validateApiKey, ...settingsToSave } = state;
      
      console.log('Saving settings:', {
        hasOpenAIKey: !!settingsToSave.openai.apiKey,
        hasAnthropicKey: !!settingsToSave.anthropic.apiKey
      });

      // Send the settings directly as they match the Rust Settings struct
      await invoke('save_settings', {
        contents: JSON.stringify(settingsToSave, null, 2)
      });

    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  validateApiKey: async (provider: ModelProvider) => {
    const state = get();
    const apiKey = provider === 'openai' ? state.openai.apiKey : state.anthropic.apiKey;
    
    if (!apiKey) return false;

    try {
      // Basic format validation
      if (provider === 'openai' && !apiKey.startsWith('sk-')) return false;
      if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) return false;

      // TODO: Implement actual API validation once we have the backend handlers
      return true;
    } catch (error) {
      console.error(`Failed to validate ${provider} API key:`, error);
      return false;
    }
  }
})); 