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

  const rm = message.recalledMemory;
  const indicatorParts: string[] = [];

  if (rm) {
    if (rm.semanticConcepts && rm.semanticConcepts.length > 0) {
      indicatorParts.push(`Semantic: ${rm.semanticConcepts.join(', ')}`);
    }
    if (rm.reflectionTags && rm.reflectionTags.length > 0) {
      indicatorParts.push(`Reflection: ${rm.reflectionTags.join(', ')}`);
    }
    if (rm.workingCount > 0 && indicatorParts.length === 0) {
      indicatorParts.push(`Working: ${rm.workingCount} turns`);
    }
  }

  const indicatorText = indicatorParts.length > 0 ? indicatorParts.join(' · ') : recalledConcept || null;

  return (
    <div className={`flex w-full my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar Badge */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            isUser
              ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-gradient-to-tr from-emerald-500 via-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
          }`}
        >
          {isUser ? 'U' : '🧠'}
        </div>

        {/* Message Bubble Container */}
        <div className="flex flex-col">
          {/* Compact Polished Memory Recalled Indicator */}
          {!isUser && (
            <div className="mb-1.5 flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                🧠 {indicatorText ? `Memory recalled · ${indicatorText}` : '3-Tier Memory Context'}
              </span>
            </div>
          )}

          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-indigo-900/60 border border-indigo-500/30 text-indigo-50 rounded-tr-none shadow-lg shadow-indigo-950/40'
                : 'bg-slate-900/90 border border-slate-700/50 text-slate-100 rounded-tl-none shadow-lg shadow-slate-950/40'
            }`}
          >
            <p className="whitespace-pre-wrap m-0 font-sans">{message.content}</p>
          </div>

          {/* Footer Metadata Badge */}
          <div
            className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {formattedTime && <span>{formattedTime}</span>}
            {formattedTime && <span>•</span>}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              {isUser ? 'input_turn' : 'working_memory'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
