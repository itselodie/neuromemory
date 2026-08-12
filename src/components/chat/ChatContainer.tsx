'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WorkingMemoryItem } from '@/types/memory';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  initialSessionId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ initialSessionId = 'session_demo_default' }) => {
  const [sessionId, setSessionId] = useState<string>(initialSessionId);
  const [isEditingSession, setIsEditingSession] = useState<boolean>(false);
  const [tempSessionId, setTempSessionId] = useState<string>(initialSessionId);
  const [messages, setMessages] = useState<WorkingMemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages update or loading state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome message explaining NeuroMemory context retrieval
  useEffect(() => {
    setMessages([
      {
        id: 'welcome_turn',
        sessionId,
        role: 'assistant',
        content: `Welcome to NeuroMemory! 🧠\n\nI am your cognitive AI assistant powered by an autonomous memory architecture:\n• 🧠 Working Memory (active conversation history)\n• ⚡ Reflection Memory (recurring insights & patterns)\n• 💎 Semantic Memory (consolidated knowledge concepts)\n\nAsk me anything, or select a suggested prompt below!`,
        createdAt: new Date(),
      },
    ]);
  }, [sessionId]);

  const handleSessionChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempSessionId.trim()) {
      setSessionId(tempSessionId.trim());
      setIsEditingSession(false);
      setErrorMessage(null);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setErrorMessage(null);

    // Optimistically push user turn into chat UI
    const userTurn: WorkingMemoryItem = {
      id: `user_${Date.now()}`,
      sessionId,
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userTurn]);
    setIsLoading(true);

    try {
      // Execute request to the /api/chat Next.js route
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const assistantContent = data.response || data.assistantResponse || 'Memory context processed successfully.';

      // Append assistant turn to chat state
      const assistantTurn: WorkingMemoryItem = {
        id: `assistant_${Date.now()}`,
        sessionId,
        role: 'assistant',
        content: assistantContent,
        recalledMemory: data.recalledMemory,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantTurn]);
    } catch (err) {
      console.error('[NeuroMemory Chat Error]:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to communicate with NeuroMemory API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sessionId,
        role: 'assistant',
        content: `Working memory buffer cleared for session "${sessionId}". Ready for new conversation turns!`,
        createdAt: new Date(),
      },
    ]);
    setErrorMessage(null);
  };

  const promptSuggestions = [
    'What do you remember about me?',
    "Summarize what we've discussed.",
    'What patterns have you noticed?',
    'What did I mention earlier?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-4xl mx-auto w-full glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950/80">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2 m-0">
              NeuroMemory Assistant
            </h2>

            {/* Session ID Editor */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span>Session:</span>
              {isEditingSession ? (
                <form onSubmit={handleSessionChangeSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempSessionId}
                    onChange={(e) => setTempSessionId(e.target.value)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-100 border border-indigo-500 text-xs font-mono focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="text-[11px] text-emerald-400 font-semibold px-1.5 py-0.5 hover:underline">
                    Save
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsEditingSession(true)}
                  className="font-mono text-indigo-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-500 transition-all flex items-center gap-1 text-[11px]"
                  title="Click to change session ID"
                >
                  <span>{sessionId}</span>
                  <span className="text-[10px] text-slate-400">✏️</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cognitive Memory Tier Indicators */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
            <span className="text-indigo-400 font-bold">🧠</span>
            <span className="hidden md:inline">Working Memory</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
            <span className="text-amber-400 font-bold">⚡</span>
            <span className="hidden md:inline">Reflection Memory</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
            <span className="text-cyan-400 font-bold">💎</span>
            <span className="hidden md:inline">Semantic Memory</span>
          </div>
          <button
            onClick={handleClearHistory}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
            title="Reset session working memory view"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-950/70 border border-red-800/60 text-red-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <p className="font-semibold m-0">API Request Failed</p>
              <p className="text-[11px] text-red-300 m-0">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-100 font-bold text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Scroll Body */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Product-focused Loading State */}
        {isLoading && (
          <div className="flex items-start gap-3 my-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-cyan-500/20 animate-pulse">
              🧠
            </div>
            <div className="flex flex-col">
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-900/90 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Recalling relevant memories…</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 ml-1 font-mono">
                Working Memory ➔ Reflection Memory ➔ Semantic Memory
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestion Chips */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-6 py-2 border-t border-slate-900 bg-slate-950/60">
          <p className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
            <span>💡 Suggested Prompts:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-left text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Chat Input Form Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/90">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};
