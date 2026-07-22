/**
 * NeuroMemory — Semantic Memory Database Service
 * Manages database operations for the `semantic_memory` table in CockroachDB.
 * Schema: (id, user_id, session_id, concept, content, embedding, significance_score, reinforcement_count, concept_tags, source_episodic_ids, created_at, last_accessed_at, metadata)
 */

import { queryDB, dbStore, getDatabaseConfig } from '@/lib/cockroach/client';
import { formatVectorParam } from '@/lib/cockroach/vector';
import { SemanticMemoryItem, CreateSemanticMemoryInput } from '@/types/memory';

/**
 * Inserts a consolidated concept memory into the `semantic_memory` table.
 */
export async function createSemanticMemory(input: CreateSemanticMemoryInput): Promise<SemanticMemoryItem> {
  const config = getDatabaseConfig();
  const id = crypto.randomUUID();
  const now = new Date();

  const newItem: SemanticMemoryItem = {
    id,
    userId: input.userId || 'default_user',
    sessionId: input.sessionId,
    concept: input.concept,
    content: input.content,
    embedding: input.embedding || [],
    significanceScore: input.significanceScore ?? 0.7,
    reinforcementCount: 1,
    conceptTags: input.conceptTags || [],
    sourceEpisodicIds: input.sourceEpisodicIds || [],
    createdAt: now,
    lastAccessedAt: now,
    metadata: input.metadata || {},
  };

  if (config.isStubbed) {
    dbStore.semantic.push(newItem);
    return newItem;
  }

  const sql = `
    INSERT INTO semantic_memory (
      id, user_id, session_id, concept, content, embedding, significance_score,
      reinforcement_count, concept_tags, source_episodic_ids, created_at, last_accessed_at, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8, $9, $10, $11, $12, $13)
    RETURNING 
      id, user_id AS "userId", session_id AS "sessionId", concept, content,
      significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
      concept_tags AS "conceptTags", source_episodic_ids AS "sourceEpisodicIds",
      created_at AS "createdAt", last_accessed_at AS "lastAccessedAt", metadata;
  `;

  const params = [
    newItem.id,
    newItem.userId,
    newItem.sessionId,
    newItem.concept,
    newItem.content,
    formatVectorParam(newItem.embedding || []),
    newItem.significanceScore,
    newItem.reinforcementCount,
    newItem.conceptTags,
    newItem.sourceEpisodicIds,
    newItem.createdAt,
    newItem.lastAccessedAt,
    JSON.stringify(newItem.metadata),
  ];

  try {
    const rows = await queryDB<SemanticMemoryItem>(sql, params);
    if (rows && rows.length > 0) {
      return { ...rows[0], embedding: newItem.embedding };
    }
  } catch (err) {
    console.warn('[SemanticMemoryService] Failed to insert into CockroachDB, using fallback stub.', err);
  }

  dbStore.semantic.push(newItem);
  return newItem;
}

/**
 * Retrieves all semantic memories for a session or globally.
 */
export async function getSemanticMemories(sessionId?: string): Promise<SemanticMemoryItem[]> {
  const config = getDatabaseConfig();

  if (config.isStubbed) {
    return dbStore.semantic
      .filter((m) => !sessionId || m.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const sql = sessionId
    ? `
      SELECT 
        id, user_id AS "userId", session_id AS "sessionId", concept, content,
        significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
        concept_tags AS "conceptTags", source_episodic_ids AS "sourceEpisodicIds",
        created_at AS "createdAt", last_accessed_at AS "lastAccessedAt", metadata
      FROM semantic_memory
      WHERE session_id = $1
      ORDER BY created_at DESC;
    `
    : `
      SELECT 
        id, user_id AS "userId", session_id AS "sessionId", concept, content,
        significance_score AS "significanceScore", reinforcement_count AS "reinforcementCount",
        concept_tags AS "conceptTags", source_episodic_ids AS "sourceEpisodicIds",
        created_at AS "createdAt", last_accessed_at AS "lastAccessedAt", metadata
      FROM semantic_memory
      ORDER BY created_at DESC;
    `;

  const params = sessionId ? [sessionId] : [];

  try {
    const rows = await queryDB<SemanticMemoryItem>(sql, params);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('[SemanticMemoryService] Query failed, returning stub list.', err);
  }

  return dbStore.semantic
    .filter((m) => !sessionId || m.sessionId === sessionId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
