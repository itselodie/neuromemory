'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WorkingMemoryItem } from '@/types/memory';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  initialSessionId?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ initialSessionId = 'session_demo_01' }) => {
  const [sessionId] = useState<string>(initialSessionId);
  const [messages, setMessages] = useState<WorkingMemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch working memory session history on load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/chat?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          setMessages(data.history);
        }
      } catch (err) {
        console.error('Failed to load initial working memory history:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Optimistically add user turn to local UI state
    const optimisticUserTurn: WorkingMemoryItem = {
      id: `temp_${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserTurn]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: 'demo_user',
          content,
          topicTag: 'working_memory_chat',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setMessages(data.history);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto w-full glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 m-0">
              NeuroMemory Chat
            </h2>
            <p className="text-xs text-slate-400 m-0">
              Active Tier: <span className="font-mono text-indigo-400">working_memory</span> • Session: <span className="font-mono text-slate-300">{sessionId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Phase 2: Working Memory
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-2">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Initializing Working Memory session...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 mb-3">
              🧠
            </div>
            <h3 className="text-base font-medium text-slate-200 mb-1">Working Memory Buffer Ready</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Send your first message to begin. All conversation turns are stored directly in CockroachDB&apos;s <code className="text-indigo-300 font-mono text-[11px]">working_memory</code> table.
            </p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {/* Loading Indicator for AI response */}
        {isLoading && (
          <div className="flex items-center gap-3 my-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
              AI
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-900/80 border border-slate-700/40 text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 dot-1" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 dot-2" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 dot-3" />
              <span className="ml-1 text-slate-400">Writing turn to working_memory...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || isInitializing} />
      </div>
    </div>
  );
};
