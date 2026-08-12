'use client';

import React from 'react';

export const MemoryTimeline: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800 p-6 gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 m-0">
          ⏳ Cognitive Memory Progression Timeline
        </h2>
        <p className="text-xs text-slate-400 m-0">
          Visual flow depicting turn progression from Working Memory to Episodic Memory, Semantic Abstraction, and S3 Archival
        </p>
      </div>

      {/* 4-Stage Visual Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {/* Stage 1: Working Memory */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/40 flex flex-col gap-2 relative group hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400">1. Working Memory</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          </div>
          <p className="text-xs text-slate-300 font-mono">Active turn buffer</p>
          <div className="mt-auto pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
            <div>Schema: working_memory</div>
            <div>No embeddings / scoring</div>
            <div>Raw session turn logs</div>
          </div>
        </div>

        {/* Stage 2: Episodic Memory */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/40 flex flex-col gap-2 relative group hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400">2. Episodic Memory</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950 text-purple-300 font-mono">Vector(1536)</span>
          </div>
          <p className="text-xs text-slate-300 font-mono">Trace interaction</p>
          <div className="mt-auto pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
            <div>Significance Score: calculated</div>
            <div>Formula: base + 0.5 + 0.3 + 0.2</div>
            <div>Promoted: False</div>
          </div>
        </div>

        {/* Stage 3: Semantic Memory */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 flex flex-col gap-2 relative group hover:border-cyan-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400">3. Semantic Memory</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 font-mono">Consolidated</span>
          </div>
          <p className="text-xs text-slate-300 font-mono">Concept facts</p>
          <div className="mt-auto pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
            <div>Promotion Reason: count &ge; 3 OR score &ge; 2.0</div>
            <div>Reinforcement Count: incremented</div>
            <div>Synthesized VECTOR(1536)</div>
          </div>
        </div>

        {/* Stage 4: S3 Cold Archive */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/40 flex flex-col gap-2 relative group hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">4. Archived Vault</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-950 text-blue-300 font-mono">Cold Vault</span>
          </div>
          <p className="text-xs text-slate-300 font-mono">Offloaded cold storage</p>
          <div className="mt-auto pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
            <div>Reason: low_significance_decay</div>
            <div>Target: archive_log</div>
            <div>Key: archive/neuromemory/...</div>
          </div>
        </div>
      </div>

      {/* Detailed Debug Metrics Panel */}
      <div className="flex-1 border border-slate-800 rounded-xl p-5 bg-slate-950/60 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-300 m-0 uppercase tracking-wider">🔬 Cognitive Memory Architecture Specification Panel</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Debug Card 1 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <span className="text-indigo-400 font-bold">Significance Score Formula</span>
            <p className="text-slate-300 text-[11px] leading-relaxed m-0">
              score = base_weight(event_type) + 0.5 (struggle/repeat) + 0.3 (topic recursion) + 0.2 (&quot;remember this&quot;)
            </p>
          </div>

          {/* Debug Card 2 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <span className="text-purple-400 font-bold">Semantic Promotion Criteria</span>
            <p className="text-slate-300 text-[11px] leading-relaxed m-0">
              Promoted to semantic_memory when reinforcement_count &ge; 3 OR significance_score &ge; 2.0
            </p>
          </div>

          {/* Debug Card 3 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <span className="text-cyan-400 font-bold">Vector Similarity Search</span>
            <p className="text-slate-300 text-[11px] leading-relaxed m-0">
              Cosine Similarity Search: (1 - (embedding &lt;=&gt; query_vector)) over VECTOR(1536) columns
            </p>
          </div>

          {/* Debug Card 4 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <span className="text-blue-400 font-bold">Cold Storage Decay & Archiving</span>
            <p className="text-slate-300 text-[11px] leading-relaxed m-0">
              Low significance memories offloaded to cold storage vault and tracked in archive_log table
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
