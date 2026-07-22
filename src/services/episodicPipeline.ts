/**
 * NeuroMemory — Episodic Memory Pipeline Orchestrator
 * Connects working memory turns to significance scoring, 1536-d vector embedding generation,
 * and episodic memory table insertion.
 */

import { calculateSignificanceScore, EventType } from '@/lib/memory/significanceScorer';
import { generateEmbedding } from '@/lib/aws/bedrock';
import { createEpisodicMemory } from '@/services/episodicMemoryService';
import { WorkingMemoryItem, EpisodicMemoryItem } from '@/types/memory';

export interface ProcessTurnResult {
  significanceScore: number;
  scoreBreakdown: ReturnType<typeof calculateSignificanceScore>['breakdown'];
  episodicMemory?: EpisodicMemoryItem;
}

/**
 * Processes a working memory turn through the episodic memory pipeline.
 * Computes significance score, generates 1536-d vector embedding, and persists to episodic_memory.
 */
export async function processTurnForEpisodicMemory(
  turn: WorkingMemoryItem,
  sessionHistoryContents: string[] = []
): Promise<ProcessTurnResult> {
  const eventType: EventType = turn.role === 'user' ? 'user_message' : 'assistant_message';

  // 1. Calculate significance score using the exact 4-rule formula
  const scoring = calculateSignificanceScore({
    eventType,
    content: turn.content,
    sessionHistory: sessionHistoryContents,
  });

  // 2. Generate 1536-dimensional vector embedding (Bedrock or deterministic stub)
  const embedding = await generateEmbedding(turn.content);

  // 3. Extract concept tags (simple keywords)
  const conceptTags = extractKeywords(turn.content);

  // 4. Create and persist item to episodic_memory table
  const episodicItem = await createEpisodicMemory({
    userId: turn.userId,
    sessionId: turn.sessionId,
    content: turn.content,
    embedding,
    significanceScore: scoring.score,
    conceptTags,
    metadata: {
      sourceTurnId: turn.id,
      role: turn.role,
      topicTag: turn.topicTag,
      scoreBreakdown: scoring.breakdown,
    },
  });

  return {
    significanceScore: scoring.score,
    scoreBreakdown: scoring.breakdown,
    episodicMemory: episodicItem,
  };
}

function extractKeywords(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = clean.split(/\s+/).filter((w) => w.length > 3);
  const unique = Array.from(new Set(words));
  return unique.slice(0, 5);
}
