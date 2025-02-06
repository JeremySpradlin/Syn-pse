import { useState, FormEvent } from 'react';
import { Send, RefreshCw } from 'lucide-react';

interface Props {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: Props) {
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    await onSubmit(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="border-t border-white/5 bg-black/20">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-3 bg-white/5 text-gray-100 rounded-xl
              placeholder:text-gray-500 focus:outline-none focus:ring-2 
              focus:ring-blue-500/50 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700
              disabled:opacity-50 disabled:hover:bg-blue-600 transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
              shadow-lg shadow-blue-500/20"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 