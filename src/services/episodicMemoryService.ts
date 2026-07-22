/**
 * NeuroMemory — Episodic Memory Database Service
 * Manages SQL database operations for the `episodic_memory` table in CockroachDB.
 * Schema: (id, user_id, session_id, content, embedding, significance_score, reinforcement_count, concept_tags, promoted, created_at, last_accessed_at, metadata)
 */

import { queryDB, dbStore, getDatabaseConfig } from '@/lib/cockroach/client';
import { formatVectorParam } from '@/lib/cockroach/vector';
import { EpisodicMemoryItem, CreateEpisodicMemoryInput } from '@/types/memory';

/**
 * Inserts a new qualified item into the `episodic_memory` table
 */
export async function createEpisodicMemory(input: CreateEpisodicMemoryInput): Promise<EpisodicMemoryItem> {
  const config = getDatabaseConfig();
  const id = crypto.randomUUID();
  const now = new Date();

  const newItem: EpisodicMemoryItem = {
    id,
    userId: input.userId || 'default_user',
    sessionId: input.sessionId,
    content: input.content,
    embedding: input.embedding || [],
    significanceScore: input.significanceScore ?? 0.5,
    reinforcementCount: 0,
    conceptTags: input.conceptTags || [],
    promoted: false,
    createdAt: now,
    lastAccessedAt: now,
    metadata: input.metadata || {},
  };

  if (config.isStubbed) {
    dbStore.episodic.push(newItem);
    return newItem;
  }

  const sql = `
    INSERT INTO episodic_memory (
      id, user_id, session_id, content, embedding, significance_score,
      reinforcement_count, concept_tags, promoted, created_at, last_accessed_at, metadata
    )
    VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $8, $9, $10, $11, $12)
    RETURNING 
      id, user_id AS "userId", session_id AS "sessionId", content,
      significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
      concept_tags AS "conceptTags", promoted, created_at AS "createdAt",
      last_accessed_at AS "lastAccessedAt", metadata;
  `;

  const params = [
    newItem.id,
    newItem.userId,
    newItem.sessionId,
    newItem.content,
    formatVectorParam(newItem.embedding || []),
    newItem.significanceScore,
    newItem.reinforcementCount,
    newItem.conceptTags,
    newItem.promoted,
    newItem.createdAt,
    newItem.lastAccessedAt,
    JSON.stringify(newItem.metadata),
  ];

  try {
    const rows = await queryDB<EpisodicMemoryItem>(sql, params);
    if (rows && rows.length > 0) {
      return { ...rows[0], embedding: newItem.embedding };
    }
  } catch (err) {
    console.warn('[EpisodicMemoryService] Failed to insert into CockroachDB, using fallback stub.', err);
  }

  dbStore.episodic.push(newItem);
  return newItem;
}

/**
 * Retrieves episodic memories for a given session ID
 */
export async function getEpisodicMemoriesBySession(sessionId: string): Promise<EpisodicMemoryItem[]> {
  const config = getDatabaseConfig();

  if (config.isStubbed) {
    return dbStore.episodic
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const sql = `
    SELECT 
      id, user_id AS "userId", session_id AS "sessionId", content,
      significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
      concept_tags AS "conceptTags", promoted, created_at AS "createdAt",
      last_accessed_at AS "lastAccessedAt", metadata
    FROM episodic_memory
    WHERE session_id = $1
    ORDER BY created_at DESC;
  `;

  try {
    const rows = await queryDB<EpisodicMemoryItem>(sql, [sessionId]);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('[EpisodicMemoryService] Query failed, returning stubbed list.', err);
  }

  return dbStore.episodic
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
