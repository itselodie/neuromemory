'use client';

import React, { useState } from 'react';
import { SleepCycleResult } from '@/services/sleepCycleService';

interface SleepCycleDashboardProps {
  sessionId: string;
}

export const SleepCycleDashboard: React.FC<SleepCycleDashboardProps> = ({ sessionId }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SleepCycleResult | null>(null);

  const handleRunSleepCycle = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/v1/sleep-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setLastResult(data.result);
      }
    } catch (err) {
      console.error('Failed to execute sleep cycle:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800 p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 m-0">
            🌙 Sleep Cycle & Consolidation Dashboard
          </h2>
          <p className="text-xs text-slate-400 m-0">
            Triggers semantic abstraction (reinforcement_count &ge; 3 OR significance_score &ge; 2.0) and S3 cold storage offloading
          </p>
        </div>

        <button
          onClick={handleRunSleepCycle}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing Concepts...</span>
            </>
          ) : (
            <>
              <span>⚡ Run Sleep Cycle Consolidation</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Promoted Count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-800/40 flex flex-col gap-1">
          <span className="text-xs font-semibold text-indigo-300">Promoted Memories</span>
          <span className="text-3xl font-extrabold text-white font-mono">
            {lastResult ? lastResult.promotedCount : 0}
          </span>
          <span className="text-[11px] text-slate-400">Promoted into Semantic Memory</span>
        </div>

        {/* Metric 2: Archived Memories Count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border border-cyan-800/40 flex flex-col gap-1">
          <span className="text-xs font-semibold text-cyan-300">Archived Memories</span>
          <span className="text-3xl font-extrabold text-white font-mono">
            {lastResult ? lastResult.archivedCount : 0}
          </span>
          <span className="text-[11px] text-slate-400">Offloaded to Cold Storage Vault</span>
        </div>

        {/* Metric 3: Reinforced Semantic Memories Count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-pink-950/40 border border-purple-800/40 flex flex-col gap-1">
          <span className="text-xs font-semibold text-purple-300">Reinforced Concepts</span>
          <span className="text-3xl font-extrabold text-white font-mono">
            {lastResult ? lastResult.semanticMemoriesCreated.length : 0}
          </span>
          <span className="text-[11px] text-slate-400">Synthesized VECTOR(1536) Concepts</span>
        </div>
      </div>

      {/* Run Log Results */}
      <div className="flex-1 border border-slate-800 rounded-xl p-4 bg-slate-950/60 overflow-y-auto custom-scrollbar flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-300 m-0 uppercase tracking-wider">Sleep Cycle Execution Trace Log</h3>
        {lastResult ? (
          <div className="flex flex-col gap-2 font-mono text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold">[SUCCESS]</span> Sleep cycle execution completed for session: <span className="text-indigo-300">{lastResult.sessionId}</span>
            </div>
            {lastResult.semanticMemoriesCreated.map((s, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-900/60 flex flex-col gap-1">
                <span className="text-cyan-300 font-bold">Created Semantic Concept #{idx + 1}: &quot;{s.concept}&quot;</span>
                <span className="text-slate-400 text-[11px]">{s.content}</span>
                <span className="text-slate-500 text-[10px]">VECTOR(1536) • Sources: {s.sourceEpisodicIds.length} episodic memories</span>
              </div>
            ))}
            {lastResult.archiveLogsCreated.map((a, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 flex flex-col gap-1">
                <span className="text-blue-300 font-bold">Cold Vault Archive #{idx + 1}</span>
                <span className="text-slate-400 text-[11px]">Object Key: {a.s3ObjectKey}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            Click &quot;Run Sleep Cycle Consolidation&quot; to execute semantic promotion and S3 archiving.
          </div>
        )}
      </div>
    </div>
  );
};
