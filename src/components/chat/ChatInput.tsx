'use client';

import React, { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative flex items-center gap-2">
      <div className="relative flex-grow">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask NeuroMemory a question... (Contextualized via Working, Reflection & Semantic memory)'}
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-100 placeholder-slate-400 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all custom-scrollbar disabled:opacity-50"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-medium text-sm flex items-center justify-center transition-all shadow-md hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:text-slate-500 cursor-pointer"
        title="Send Message to NeuroMemory"
      >
        {disabled ? (
          <span className="flex items-center gap-1 px-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        ) : (
          <svg className="w-4 h-4 transform rotate-90 fill-current" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        )}
      </button>
    </form>
  );
};
