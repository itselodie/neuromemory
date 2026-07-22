'use client';

import React from 'react';
import { WorkingMemoryItem } from '@/types/memory';

interface ChatMessageProps {
  message: WorkingMemoryItem;
  recalledConcept?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, recalledConcept }) => {
  const isUser = message.role === 'user';
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex w-full my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar Badge */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            isUser
              ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
          }`}
        >
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message Bubble Container */}
        <div className="flex flex-col">
          {/* Proactive Recall Indicator */}
          {!isUser && (recalledConcept || message.content.includes('Before we begin')) && (
            <div className="mb-1.5 flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 animate-pulse">
              <span>🧠 Memory Retrieved</span>
              {recalledConcept && <span className="opacity-80 font-mono">({recalledConcept})</span>}
            </div>
          )}

          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed glass-panel ${
              isUser
                ? 'bg-indigo-950/70 border-indigo-500/30 text-indigo-100 rounded-tr-none'
                : 'bg-slate-900/80 border-slate-700/40 text-slate-100 rounded-tl-none'
            }`}
          >
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          </div>

          {/* Footer Metadata Badge */}
          <div
            className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <span>{formattedTime}</span>
            <span>•</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
              working_memory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
