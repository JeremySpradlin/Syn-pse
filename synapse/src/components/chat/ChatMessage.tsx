import { memo } from 'react';
import type { Message } from '../../types/chat';

interface Props {
  message: Message;
  timestamp: string;
}

export const ChatMessage = memo(({ message, timestamp }: Props) => {
  return (
    <div
      className={`flex items-end gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role !== 'user' && (
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/25 flex items-center justify-center">
          <span className="text-indigo-300 text-sm font-medium">AI</span>
        </div>
      )}
      <div
        className={`
          group max-w-[80%] px-4 py-2.5 rounded-2xl
          ${message.role === 'user' 
            ? 'bg-blue-600 text-white ml-4' 
            : 'bg-white/5 backdrop-blur-sm text-gray-100 mr-4'}
        `}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <span className="text-xs opacity-50 mt-1 inline-block">{timestamp}</span>
      </div>
      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/25 flex items-center justify-center">
          <span className="text-blue-300 text-sm font-medium">You</span>
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage'; 