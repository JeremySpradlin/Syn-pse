import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { Settings, DEFAULT_SETTINGS, Model, ModelProvider } from '../types/settings';

interface SettingsState extends Settings {
  isLoading: boolean;
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
    set({ isLoading: true });
    try {
      // Load settings using our Rust commands
      try {
        const contents = await invoke<string>('load_settings');
        if (contents) {
          const settings = JSON.parse(contents) as Partial<Settings>;
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
      set({ isLoading: false });
    }
  },

  saveSettings: async () => {
    const state = get();
    set({ isLoading: true });
    try {
      // Save non-sensitive settings
      const { isLoading, setSettings, setModel, setProvider, loadSettings, saveSettings, validateApiKey, ...settingsToSave } = state;
      
      // Create a new settings object without API keys
      const fileSettings: Settings = {
        ...settingsToSave,
        openai: { ...settingsToSave.openai, apiKey: '' },
        anthropic: { ...settingsToSave.anthropic, apiKey: '' }
      };

      await invoke('save_settings', {
        contents: JSON.stringify(fileSettings, null, 2)
      });

      // Save API keys
      if (state.openai.apiKey) {
        await invoke('save_api_key', {
          provider: 'openai',
          key: state.openai.apiKey
        });
      } else {
        await invoke('delete_api_key', {
          provider: 'openai'
        }).catch(() => {});
      }
      
      if (state.anthropic.apiKey) {
        await invoke('save_api_key', {
          provider: 'anthropic',
          key: state.anthropic.apiKey
        });
      } else {
        await invoke('delete_api_key', {
          provider: 'anthropic'
        }).catch(() => {});
      }
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