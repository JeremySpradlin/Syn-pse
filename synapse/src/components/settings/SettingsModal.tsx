import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { openaiKey, anthropicKey, selectedModel, isLoading, setSettings, loadSettings, saveSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-[500px] border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                Model Provider
              </label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSettings({ selectedModel: e.target.value as 'openai' | 'anthropic' })}
                className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                  border border-white/10 focus:outline-none focus:ring-2 
                  focus:ring-blue-500/50 transition-all"
                disabled={isLoading}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                id="openai-key"
                type="password"
                value={openaiKey}
                onChange={(e) => setSettings({ openaiKey: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                  border border-white/10 focus:outline-none focus:ring-2 
                  focus:ring-blue-500/50 transition-all"
                placeholder="sk-..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-300 mb-2">
                Anthropic API Key
              </label>
              <input
                id="anthropic-key"
                type="password"
                value={anthropicKey}
                onChange={(e) => setSettings({ anthropicKey: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/20 text-gray-100 rounded-xl
                  border border-white/10 focus:outline-none focus:ring-2 
                  focus:ring-blue-500/50 transition-all"
                placeholder="sk-ant-..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
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