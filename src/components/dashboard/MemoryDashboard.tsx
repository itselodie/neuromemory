'use client';

import React, { useState, useEffect } from 'react';
import { WorkingMemoryItem, EpisodicMemoryItem, SemanticMemoryItem } from '@/types/memory';

interface MemoryDashboardProps {
  sessionId: string;
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({ sessionId }) => {
  const [workingItems, setWorkingItems] = useState<WorkingMemoryItem[]>([]);
  const [episodicItems, setEpisodicItems] = useState<EpisodicMemoryItem[]>([]);
  const [semanticItems, setSemanticItems] = useState<SemanticMemoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'working' | 'episodic' | 'semantic'>('working');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAllMemories = async () => {
    setIsLoading(true);
    try {
      // 1. Working memory
      const resWorking = await fetch(`/api/v1/chat?sessionId=${encodeURIComponent(sessionId)}`);
      const dataWorking = await resWorking.json();
      if (dataWorking.success) setWorkingItems(dataWorking.history || []);

      // 2. Memory Search for recent memories
      const resSearch = await fetch(`/api/v1/memories/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'memory summary', sessionId, limit: 10 }),
      });
      const dataSearch = await resSearch.json();
      if (dataSearch.success && dataSearch.result) {
        setSemanticItems(dataSearch.result.semanticMemoryMatches.map((m: { memory: SemanticMemoryItem }) => m.memory));
        setEpisodicItems(dataSearch.result.episodicMemoryMatches.map((m: { memory: EpisodicMemoryItem }) => m.memory));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard memories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMemories();
  }, [sessionId]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Dashboard Tab Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            📊 Live Memory Dashboard
          </h2>
          <p className="text-xs text-slate-400 m-0">Inspect real-time 3-tier memory states in CockroachDB</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('working')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'working'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Working ({workingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('episodic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'episodic'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Episodic ({episodicItems.length})
          </button>
          <button
            onClick={() => setActiveTab('semantic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'semantic'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semantic ({semanticItems.length})
          </button>
        </div>
      </div>

      {/* Main Content List Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching CockroachDB memory panels...</span>
          </div>
        ) : activeTab === 'working' ? (
          /* Working Memory Panel */
          <div className="flex flex-col gap-3">
            {workingItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No working memory turns recorded yet.</div>
            ) : (
              workingItems.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.role === 'user' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-cyan-900/60 text-cyan-300'}`}>
                      {item.role.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-slate-200 m-0">{item.content}</p>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'episodic' ? (
          /* Episodic Memory Panel */
          <div className="flex flex-col gap-3">
            {episodicItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No episodic memories created yet.</div>
            ) : (
              episodicItems.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-900/60 border border-purple-900/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">Episodic Memory Entry</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 border border-purple-800 text-purple-200 font-mono">
                        Significance: {item.significanceScore}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        Vector(1536)
                      </span>
                      {item.promoted && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                          PROMOTED
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 m-0">{item.content}</p>
                  {item.conceptTags && item.conceptTags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {item.conceptTags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Semantic Memory Panel */
          <div className="flex flex-col gap-3">
            {semanticItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No consolidated semantic memories created yet. Run a Sleep Cycle to synthesize concepts!</div>
            ) : (
              semanticItems.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-900/60 border border-cyan-900/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      💡 Concept: {item.concept}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-200 font-mono">
                        Reinforcements: {item.reinforcementCount}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        Sources: {item.sourceEpisodicIds?.length || 0}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 m-0">{item.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
