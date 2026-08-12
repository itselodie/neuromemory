/**
 * NeuroMemory — Automatic Cognitive Memory Cycle Module
 * Coordinates the automated 3-stage memory progression cycle:
 * Stage 1: Working Memory -> Episodic Memory promotion (via promotionEngine)
 * Stage 2: Episodic Memory -> Reflection Memory synthesis (via reflectionEngine)
 * Stage 3: Reflection Memory -> Semantic Memory consolidation (via semanticEngine)
 */

import { promoteWorkingMemory } from '@/lib/promotionEngine';
import { generateReflections } from '@/lib/reflectionEngine';
import { buildSemanticMemory } from '@/lib/semanticEngine';
import { prisma } from '@/lib/prisma';
import { EpisodicMemory, ReflectionMemory, SemanticMemory } from '@prisma/client';

export interface CognitiveCycleResult {
  sessionId: string;
  promotedCount: number;
  reflectionCount: number;
  semanticCount: number;
  promotedMemories: EpisodicMemory[];
  reflections: ReflectionMemory[];
  semanticMemories: SemanticMemory[];
}

export interface CognitiveCycleOptions {
  /**
   * Configurable turn interval threshold required to trigger cycle automatically.
   * Default is 2 turns (or set via process.env.COGNITIVE_CYCLE_INTERVAL).
   */
  turnInterval?: number;
  /**
   * Force execution of cycle regardless of turn count.
   */
  force?: boolean;
}

export const DEFAULT_CYCLE_TURN_INTERVAL = 2;

/**
 * Execute the 3-stage automatic cognitive memory cycle for a session:
 * 1. Working Memory -> Episodic Memory promotion
 * 2. Episodic Memory -> Reflection Memory synthesis
 * 3. Reflection Memory -> Semantic Memory consolidation
 *
 * @param sessionId - Session identifier to process
 * @param options - Optional configuration options
 */
export async function executeCognitiveCycle(
  sessionId: string,
  options: CognitiveCycleOptions = {}
): Promise<CognitiveCycleResult> {
  if (!sessionId) {
    throw new Error('sessionId is required for executeCognitiveCycle.');
  }

  // Stage 1: Promote eligible WorkingMemory entries to EpisodicMemory
  const promotedMemories = await promoteWorkingMemory(sessionId);

  // Stage 2: Synthesize ReflectionMemory insights from EpisodicMemory
  const reflections = await generateReflections(sessionId);

  // Stage 3: Consolidate ReflectionMemory insights into SemanticMemory concepts
  const semanticMemories = await buildSemanticMemory(sessionId);

  return {
    sessionId,
    promotedCount: promotedMemories.length,
    reflectionCount: reflections.length,
    semanticCount: semanticMemories.length,
    promotedMemories,
    reflections,
    semanticMemories,
  };
}

/**
 * Automatically trigger the cognitive memory cycle after a configurable number of turns.
 * Checks total WorkingMemory turn count for the session, and if turnCount % turnInterval === 0,
 * executes the complete cognitive cycle safely.
 *
 * @param sessionId - Session identifier to inspect and cycle
 * @param options - Optional turnInterval or force options
 */
export async function autoTriggerCognitiveCycle(
  sessionId: string,
  options: CognitiveCycleOptions = {}
): Promise<CognitiveCycleResult | null> {
  if (!sessionId) return null;

  const envInterval = process.env.COGNITIVE_CYCLE_INTERVAL ? parseInt(process.env.COGNITIVE_CYCLE_INTERVAL, 10) : undefined;
  const interval = (options.turnInterval ?? envInterval) || DEFAULT_CYCLE_TURN_INTERVAL;

  const force = options.force ?? false;

  if (!force) {
    const turnCount = await prisma.workingMemory.count({
      where: { sessionId },
    });

    if (turnCount === 0 || turnCount % interval !== 0) {
      return null;
    }
  }

  return await executeCognitiveCycle(sessionId, options);
}
