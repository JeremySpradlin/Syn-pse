export type ModelProvider = 'openai' | 'anthropic';

export type OpenAIModel = 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
export type AnthropicModel = 
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-3-5-sonnet-20241022';
export type Model = OpenAIModel | AnthropicModel;

export type ContentFilterLevel = 'strict' | 'moderate' | 'low';

export interface OpenAISettings {
  apiKey: string;
  orgId?: string;
  defaultTemperature: number;
  maxTokens: number;
  systemPrompt: string;
  useModeration: boolean;
}

export interface AnthropicSettings {
  apiKey: string;
  maxTokens: number;
  systemPrompt: string;
  stopSequences?: string[];
}

export interface SafetySettings {
  contentFilterLevel: ContentFilterLevel;
  enabledCapabilities: {
    codeGeneration: boolean;
    externalLinks: boolean;
  };
}

export interface Settings {
  selectedModel: Model;
  defaultProvider: ModelProvider;
  openai: OpenAISettings;
  anthropic: AnthropicSettings;
  safety: SafetySettings;
}

// Default settings values
export const DEFAULT_SETTINGS: Settings = {
  selectedModel: 'gpt-4-turbo-preview',
  defaultProvider: 'openai',
  openai: {
    apiKey: '',
    defaultTemperature: 0.7,
    maxTokens: 4096,
    systemPrompt: '',
    useModeration: true
  },
  anthropic: {
    apiKey: '',
    maxTokens: 4096,
    systemPrompt: '',
    stopSequences: []
  },
  safety: {
    contentFilterLevel: 'moderate',
    enabledCapabilities: {
      codeGeneration: true,
      externalLinks: true
    }
  }
}; 