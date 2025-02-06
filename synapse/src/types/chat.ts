export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: string;
} 