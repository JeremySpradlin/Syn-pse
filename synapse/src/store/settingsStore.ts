import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface Settings {
  selectedModel: 'openai' | 'anthropic';
}

interface SecureSettings {
  openaiKey: string;
  anthropicKey: string;
}

interface SettingsState extends Settings, SecureSettings {
  isLoading: boolean;
  setSettings: (settings: Partial<Settings & SecureSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const SETTINGS_FILE = 'settings.json';
const KEYCHAIN_SERVICE = 'synapse-api-keys';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  openaiKey: '',
  anthropicKey: '',
  selectedModel: 'openai',
  isLoading: false,

  setSettings: (settings) => {
    set((state) => ({ ...state, ...settings }));
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
          const settings = JSON.parse(contents) as Settings;
          set((state) => ({ ...state, ...settings }));
        }
      } catch (error) {
        // File might not exist on first run, which is fine
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
          ...(openaiKey ? { openaiKey } : {}),
          ...(anthropicKey ? { anthropicKey } : {})
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
    const { openaiKey, anthropicKey, selectedModel } = get();
    set({ isLoading: true });
    try {
      // Save non-sensitive settings to file
      await invoke('plugin:fs|write_file', {
        path: SETTINGS_FILE,
        contents: JSON.stringify({ selectedModel }, null, 2),
        options: { dir: 'App' }
      });

      // Save API keys to keychain
      if (openaiKey) {
        await invoke('plugin:os|set_password', {
          service: KEYCHAIN_SERVICE,
          account: 'openai',
          password: openaiKey
        });
      } else {
        await invoke('plugin:os|delete_password', {
          service: KEYCHAIN_SERVICE,
          account: 'openai'
        }).catch(() => {});
      }
      
      if (anthropicKey) {
        await invoke('plugin:os|set_password', {
          service: KEYCHAIN_SERVICE,
          account: 'anthropic',
          password: anthropicKey
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
  }
})); 