import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
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

const SETTINGS_FILE = 'settings.json';
const KEYCHAIN_SERVICE = 'synapse-api-keys';

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
      // Load non-sensitive settings from file
      try {
        const contents = await invoke<string>('plugin:fs|read_file', {
          path: SETTINGS_FILE,
          options: { dir: 'App' }
        });
        if (contents) {
          const settings = JSON.parse(contents) as Partial<Settings>;
          // Create a new settings object without API keys
          const sanitizedSettings: Partial<Settings> = {
            ...settings,
            openai: settings.openai ? { ...settings.openai, apiKey: '' } : undefined,
            anthropic: settings.anthropic ? { ...settings.anthropic, apiKey: '' } : undefined
          };
          set((state) => ({ ...state, ...sanitizedSettings }));
        }
      } catch (error) {
        console.log('No existing settings file found');
      }

      // Load API keys from keychain
      try {
        const openaiKey = await invoke<string>('plugin:os|get_password', {
          service: KEYCHAIN_SERVICE,
          account: 'openai'
        });
        const anthropicKey = await invoke<string>('plugin:os|get_password', {
          service: KEYCHAIN_SERVICE,
          account: 'anthropic'
        });
        
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
        console.log('No existing API keys found in keychain');
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
      // Save non-sensitive settings to file
      const { isLoading, setSettings, setModel, setProvider, loadSettings, saveSettings, validateApiKey, ...settingsToSave } = state;
      
      // Create a new settings object without API keys
      const fileSettings: Settings = {
        ...settingsToSave,
        openai: { ...settingsToSave.openai, apiKey: '' },
        anthropic: { ...settingsToSave.anthropic, apiKey: '' }
      };

      await invoke('plugin:fs|write_file', {
        path: SETTINGS_FILE,
        contents: JSON.stringify(fileSettings, null, 2),
        options: { dir: 'App' }
      });

      // Save API keys to keychain
      if (state.openai.apiKey) {
        await invoke('plugin:os|set_password', {
          service: KEYCHAIN_SERVICE,
          account: 'openai',
          password: state.openai.apiKey
        });
      } else {
        await invoke('plugin:os|delete_password', {
          service: KEYCHAIN_SERVICE,
          account: 'openai'
        }).catch(() => {});
      }
      
      if (state.anthropic.apiKey) {
        await invoke('plugin:os|set_password', {
          service: KEYCHAIN_SERVICE,
          account: 'anthropic',
          password: state.anthropic.apiKey
        });
      } else {
        await invoke('plugin:os|delete_password', {
          service: KEYCHAIN_SERVICE,
          account: 'anthropic'
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