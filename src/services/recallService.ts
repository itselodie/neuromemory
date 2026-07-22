/**
 * NeuroMemory — Semantic Recall & Hybrid Memory Retrieval Service
 * Priority Order:
 * 1. Working Memory (Active conversation buffer turns)
 * 2. Semantic Memory (Consolidated concepts via VECTOR(1536) Cosine Distance search)
 * 3. Episodic Memory (Trace interaction history via VECTOR(1536) hybrid vector + significance score)
 */

import { getWorkingMemoryHistory } from '@/services/workingMemoryService';
import { queryDB, dbStore, getDatabaseConfig } from '@/lib/cockroach/client';
import { formatVectorParam, cosineSimilarity } from '@/lib/cockroach/vector';
import { generateEmbedding } from '@/lib/aws/bedrock';
import { WorkingMemoryItem, EpisodicMemoryItem, SemanticMemoryItem } from '@/types/memory';

export interface MemoryRecallResult {
  query: string;
  sessionId?: string;
  workingMemoryMatches: WorkingMemoryItem[];
  semanticMemoryMatches: Array<{ memory: SemanticMemoryItem; similarity: number }>;
  episodicMemoryMatches: Array<{ memory: EpisodicMemoryItem; similarity: number; hybridScore: number }>;
  formattedContextPrompt: string;
}

/**
 * Searches Working, Semantic, and Episodic memory in strict priority order.
 */
export async function searchMemories(
  queryText: string,
  sessionId?: string,
  limitPerTier: number = 3
): Promise<MemoryRecallResult> {
  const config = getDatabaseConfig();

  // 1. Generate 1536-dimensional query vector embedding
  const queryVector = await generateEmbedding(queryText);

  // --------------------------------------------------------------------------
  // Priority Tier 1: Working Memory (Active session context)
  // --------------------------------------------------------------------------
  let workingMemoryMatches: WorkingMemoryItem[] = [];
  if (sessionId) {
    const fullWorkingHistory = await getWorkingMemoryHistory(sessionId);
    // Take the last N recent working memory turns
    workingMemoryMatches = fullWorkingHistory.slice(-limitPerTier * 2);
  }

  // --------------------------------------------------------------------------
  // Priority Tier 2: Semantic Memory (Consolidated facts & concepts via VECTOR search)
  // --------------------------------------------------------------------------
  let semanticMemoryMatches: Array<{ memory: SemanticMemoryItem; similarity: number }> = [];

  if (config.isStubbed) {
    semanticMemoryMatches = dbStore.semantic
      .map((item) => {
        const similarity = item.embedding && item.embedding.length > 0
          ? cosineSimilarity(queryVector, item.embedding)
          : 0.5;
        return { memory: item, similarity };
      })
      .filter((m) => m.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limitPerTier);
  } else {
    const sql = `
      SELECT 
        id, user_id AS "userId", session_id AS "sessionId", concept, content,
        significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
        concept_tags AS "conceptTags", source_episodic_ids AS "sourceEpisodicIds",
        created_at AS "createdAt", last_accessed_at AS "lastAccessedAt", metadata,
        1 - (embedding <=> $1::vector) AS similarity
      FROM semantic_memory
      ORDER BY embedding <=> $1::vector ASC
      LIMIT $2;
    `;

    try {
      const rows = await queryDB<SemanticMemoryItem & { similarity: number }>(sql, [
        formatVectorParam(queryVector),
        limitPerTier,
      ]);
      semanticMemoryMatches = rows.map((r) => ({
        memory: r,
        similarity: parseFloat((r.similarity || 0).toFixed(4)),
      }));
    } catch (err) {
      console.warn('[RecallService] Semantic vector query failed, using stub.', err);
    }
  }

  // --------------------------------------------------------------------------
  // Priority Tier 3: Episodic Memory (Trace interaction history via hybrid vector + significance)
  // --------------------------------------------------------------------------
  let episodicMemoryMatches: Array<{ memory: EpisodicMemoryItem; similarity: number; hybridScore: number }> = [];

  if (config.isStubbed) {
    episodicMemoryMatches = dbStore.episodic
      .map((item) => {
        const similarity = item.embedding && item.embedding.length > 0
          ? cosineSimilarity(queryVector, item.embedding)
          : 0.4;
        const hybridScore = parseFloat((similarity * 0.7 + (item.significanceScore / 2.0) * 0.3).toFixed(4));
        return { memory: item, similarity, hybridScore };
      })
      .filter((m) => m.hybridScore > 0.1)
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limitPerTier);
  } else {
    const sql = `
      SELECT 
        id, user_id AS "userId", session_id AS "sessionId", content,
        significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
        concept_tags AS "conceptTags", promoted, created_at AS "createdAt",
        last_accessed_at AS "lastAccessedAt", metadata,
        1 - (embedding <=> $1::vector) AS similarity
      FROM episodic_memory
      ORDER BY (1 - (embedding <=> $1::vector)) * 0.7 + (significance_score / 2.0) * 0.3 DESC
      LIMIT $2;
    `;

    try {
      const rows = await queryDB<EpisodicMemoryItem & { similarity: number }>(sql, [
        formatVectorParam(queryVector),
        limitPerTier,
      ]);
      episodicMemoryMatches = rows.map((r) => {
        const sim = parseFloat((r.similarity || 0).toFixed(4));
        const hybrid = parseFloat((sim * 0.7 + (r.significanceScore / 2.0) * 0.3).toFixed(4));
        return { memory: r, similarity: sim, hybridScore: hybrid };
      });
    } catch (err) {
      console.warn('[RecallService] Episodic vector query failed, using stub.', err);
    }
  }

  // --------------------------------------------------------------------------
  // Synthesize Recalled Context into System Prompt Payload
  // --------------------------------------------------------------------------
  let formattedContextPrompt = '';

  if (semanticMemoryMatches.length > 0) {
    formattedContextPrompt += '=== RECALLED SEMANTIC CONCEPTS ===\n';
    semanticMemoryMatches.forEach((m, idx) => {
      formattedContextPrompt += `[Concept ${idx + 1} - ${m.memory.concept}]: ${m.memory.content}\n`;
    });
    formattedContextPrompt += '\n';
  }

  if (episodicMemoryMatches.length > 0) {
    formattedContextPrompt += '=== RECALLED EPISODIC INTERACTIONS ===\n';
    episodicMemoryMatches.forEach((m, idx) => {
      formattedContextPrompt += `[Memory ${idx + 1} - Score: ${m.memory.significanceScore}]: ${m.memory.content}\n`;
    });
    formattedContextPrompt += '\n';
  }

  return {
    query: queryText,
    sessionId,
    workingMemoryMatches,
    semanticMemoryMatches,
    episodicMemoryMatches,
    formattedContextPrompt,
  };
}
