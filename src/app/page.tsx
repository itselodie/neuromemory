'use client';

import React, { useState } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { MemoryDashboard } from '@/components/dashboard/MemoryDashboard';
import { SleepCycleDashboard } from '@/components/dashboard/SleepCycleDashboard';
import { MemoryTimeline } from '@/components/dashboard/MemoryTimeline';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'sleep' | 'timeline'>('chat');
  const demoSessionId = 'session_demo_default';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      {/* Top Branding & Navigation Header */}
      <header className="max-w-5xl mx-auto w-full mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-lg text-indigo-400">
              🧠
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 flex items-center gap-2">
              NeuroMemory
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                Cognitive Memory Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 m-0">Autonomous 3-Tier Cognitive AI Architecture</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>💬 Live Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>📊 Memory Panels</span>
          </button>

          <button
            onClick={() => setActiveTab('sleep')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sleep'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🌙 Sleep Cycle</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⏳ Timeline & Debug</span>
          </button>
        </div>
      </header>

      {/* Main Active Tab Content View */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {activeTab === 'chat' && <ChatContainer initialSessionId={demoSessionId} />}
        {activeTab === 'dashboard' && <MemoryDashboard sessionId={demoSessionId} />}
        {activeTab === 'sleep' && <SleepCycleDashboard sessionId={demoSessionId} />}
        {activeTab === 'timeline' && <MemoryTimeline />}
      </div>
    </main>
  );
}
