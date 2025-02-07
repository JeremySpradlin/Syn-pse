import { useEffect, useState, useRef } from 'react';
import { X, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { Model, ModelProvider, ContentFilterLevel } from '../../types/settings';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const {
    selectedModel,
    defaultProvider,
    openai,
    anthropic,
    safety,
    isLoading,
    hasLoaded,
    setSettings,
    setModel,
    setProvider,
    loadSettings,
    saveSettings,
    validateApiKey
  } = useSettingsStore();

  const [openaiKeyValid, setOpenaiKeyValid] = useState(false);
  const [anthropicKeyValid, setAnthropicKeyValid] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'safety'>('models');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const loadingRef = useRef(false);

  const isOpenAIModel = selectedModel.includes('gpt');

  // Effect for initial settings load
  useEffect(() => {
    const loadInitialSettings = async () => {
      if (!hasLoaded && !loadingRef.current) {
        loadingRef.current = true;
        await loadSettings();
        loadingRef.current = false;
      }
    };
    loadInitialSettings();
  }, [hasLoaded, loadSettings]);

  // Separate effect for key validation
  useEffect(() => {
    const validateKeys = async () => {
      setOpenaiKeyValid(await validateApiKey('openai'));
      setAnthropicKeyValid(await validateApiKey('anthropic'));
    };
    if (hasLoaded) {
      validateKeys();
    }
  }, [hasLoaded, openai.apiKey, anthropic.apiKey, validateApiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
    onClose();
  };

  const renderApiKeyField = (provider: 'openai' | 'anthropic') => {
    const isOpenAI = provider === 'openai';
    const settings = isOpenAI ? openai : anthropic;
    const keyValid = isOpenAI ? openaiKeyValid : anthropicKeyValid;
    
    // More detailed logging
    console.log(`${provider} API key state:`, {
      apiKey: settings.apiKey,
      hasKey: Boolean(settings.apiKey),
      keyLength: settings.apiKey?.length,
      isValid: keyValid,
      placeholder: settings.apiKey ? "••••••••" : isOpenAI ? "sk-..." : "sk-ant-..."
    });
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={`${provider}-key`} className="block text-sm font-medium text-gray-300">
            {isOpenAI ? 'OpenAI' : 'Anthropic'} API Key
          </label>
          {settings.apiKey && (
            <span className="flex items-center text-sm">
              {keyValid ? (
                <Check className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 mr-1" />
              )}
              {keyValid ? (
                <span className="text-green-400">Valid</span>
              ) : (
                <span className="text-red-400">Invalid</span>
              )}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            id={`${provider}-key`}
            type="password"
            value={settings.apiKey || ''}
            onChange={(e) => setSettings({ 
              [provider]: { ...settings, apiKey: e.target.value }
            })}
            className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
              border border-white/10 focus:outline-none focus:ring-2 
              focus:ring-blue-500/50 transition-all"
            placeholder={Boolean(settings.apiKey) ? "••••••••" : isOpenAI ? "sk-..." : "sk-ant-..."}
            disabled={isLoading}
          />
          {Boolean(settings.apiKey) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              API key stored
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-[600px] border border-white/10 flex flex-col max-h-[85vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Fixed Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('models')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'models'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Models & API Keys
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'safety'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Safety & Capabilities
          </button>
        </div>
        
        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'models' ? (
              <div className="space-y-6">
                {/* Model Selection */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                    Default Model
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                        border border-white/10 focus:outline-none focus:ring-2 
                        focus:ring-blue-500/50 transition-all flex justify-between items-center"
                      disabled={isLoading}
                    >
                      <span>{selectedModel}</span>
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </button>
                    
                    {isModelDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-gray-900 rounded-xl border border-white/10 shadow-lg">
                        <div className="py-1">
                          <div className="px-3 py-2 text-sm text-gray-400">OpenAI Models</div>
                          {['gpt-4-turbo-preview', 'gpt-3.5-turbo'].map((model) => (
                            <button
                              key={model}
                              type="button"
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 ${
                                selectedModel === model ? 'text-blue-400' : 'text-gray-100'
                              }`}
                              onClick={() => {
                                setModel(model as Model);
                                setProvider('openai');
                                setIsModelDropdownOpen(false);
                              }}
                            >
                              {model}
                            </button>
                          ))}
                          
                          <div className="px-3 py-2 text-sm text-gray-400 border-t border-white/10 mt-1">
                            Anthropic Models
                          </div>
                          {[
                            'claude-3-opus-20240229',
                            'claude-3-sonnet-20240229',
                            'claude-3-haiku-20240307',
                            'claude-3-5-sonnet-20241022'
                          ].map((model) => (
                            <button
                              key={model}
                              type="button"
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 ${
                                selectedModel === model ? 'text-blue-400' : 'text-gray-100'
                              }`}
                              onClick={() => {
                                setModel(model as Model);
                                setProvider('anthropic');
                                setIsModelDropdownOpen(false);
                              }}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Provider-specific Settings */}
                {renderApiKeyField(isOpenAIModel ? 'openai' : 'anthropic')}

                {/* Provider-specific Settings */}
                {isOpenAIModel ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Temperature
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={openai.defaultTemperature}
                          onChange={(e) => setSettings({ 
                            openai: { ...openai, defaultTemperature: parseFloat(e.target.value) }
                          })}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-400 w-12">
                          {openai.defaultTemperature}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-moderation"
                        checked={openai.useModeration}
                        onChange={(e) => setSettings({
                          openai: { ...openai, useModeration: e.target.checked }
                        })}
                        className="rounded border-white/10 bg-black/20"
                      />
                      <label htmlFor="use-moderation" className="text-sm text-gray-300">
                        Use OpenAI's content moderation
                      </label>
                    </div>
                    <div>
                      <label htmlFor="openai-system-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                        System Prompt
                      </label>
                      <textarea
                        id="openai-system-prompt"
                        value={openai.systemPrompt}
                        onChange={(e) => setSettings({
                          openai: { ...openai, systemPrompt: e.target.value }
                        })}
                        className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                          border border-white/10 focus:outline-none focus:ring-2 
                          focus:ring-blue-500/50 transition-all min-h-[100px]"
                        placeholder="Enter a system prompt to set the behavior of the AI..."
                        disabled={isLoading}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="anthropic-max-tokens" className="block text-sm font-medium text-gray-300 mb-2">
                        Max Tokens
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          id="anthropic-max-tokens"
                          value={anthropic.maxTokens}
                          onChange={(e) => setSettings({
                            anthropic: { ...anthropic, maxTokens: parseInt(e.target.value) }
                          })}
                          className="w-32 px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                            border border-white/10 focus:outline-none focus:ring-2 
                            focus:ring-blue-500/50 transition-all"
                          min="1"
                          max="4096"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-400">tokens</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="anthropic-system-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                        System Prompt
                      </label>
                      <textarea
                        id="anthropic-system-prompt"
                        value={anthropic.systemPrompt}
                        onChange={(e) => setSettings({
                          anthropic: { ...anthropic, systemPrompt: e.target.value }
                        })}
                        className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                          border border-white/10 focus:outline-none focus:ring-2 
                          focus:ring-blue-500/50 transition-all min-h-[100px]"
                        placeholder="Enter a system prompt to set the behavior of the AI..."
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Safety Settings */}
                <div>
                  <label htmlFor="filter-level" className="block text-sm font-medium text-gray-300 mb-2">
                    Content Filtering Level
                  </label>
                  <select
                    id="filter-level"
                    value={safety.contentFilterLevel}
                    onChange={(e) => setSettings({
                      safety: { ...safety, contentFilterLevel: e.target.value as ContentFilterLevel }
                    })}
                    className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                      border border-white/10 focus:outline-none focus:ring-2 
                      focus:ring-blue-500/50 transition-all"
                  >
                    <option value="strict">Strict</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Capabilities */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Enabled Capabilities</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="code-generation"
                        checked={safety.enabledCapabilities.codeGeneration}
                        onChange={(e) => setSettings({
                          safety: {
                            ...safety,
                            enabledCapabilities: {
                              ...safety.enabledCapabilities,
                              codeGeneration: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-white/10 bg-black/20"
                      />
                      <label htmlFor="code-generation" className="text-sm text-gray-300">
                        Code Generation
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="external-links"
                        checked={safety.enabledCapabilities.externalLinks}
                        onChange={(e) => setSettings({
                          safety: {
                            ...safety,
                            enabledCapabilities: {
                              ...safety.enabledCapabilities,
                              externalLinks: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-white/10 bg-black/20"
                      />
                      <label htmlFor="external-links" className="text-sm text-gray-300">
                        External Links
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 p-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50
                shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 