/**
 * NeuroMemory — Working Memory Service
 * Manages storage and retrieval of active conversation turns in the `working_memory` table.
 * Strictly adheres to Phase 2 schema: (id, user_id, session_id, role, content, topic_tag, created_at).
 */

import { queryDB, dbStore, getDatabaseConfig } from '@/lib/cockroach/client';
import { WorkingMemoryItem, CreateWorkingMemoryInput } from '@/types/memory';

/**
 * Saves a new turn (user message or assistant response) into working_memory
 */
export async function saveWorkingMemoryTurn(input: CreateWorkingMemoryInput): Promise<WorkingMemoryItem> {
  const config = getDatabaseConfig();
  const id = crypto.randomUUID();
  const createdAt = new Date();

  const newItem: WorkingMemoryItem = {
    id,
    userId: input.userId || 'default_user',
    sessionId: input.sessionId,
    role: input.role,
    content: input.content,
    topicTag: input.topicTag || 'general',
    createdAt,
  };

  if (config.isStubbed) {
    dbStore.working.push(newItem);
    return newItem;
  }

  const sql = `
    INSERT INTO working_memory (id, user_id, session_id, role, content, topic_tag, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id AS "userId", session_id AS "sessionId", role, content, topic_tag AS "topicTag", created_at AS "createdAt";
  `;

  const params = [
    newItem.id,
    newItem.userId,
    newItem.sessionId,
    newItem.role,
    newItem.content,
    newItem.topicTag,
    newItem.createdAt,
  ];

  try {
    const rows = await queryDB<WorkingMemoryItem>(sql, params);
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn('[WorkingMemoryService] Query failed, falling back to local memory store.', err);
  }

  // Fallback to stub if DB insert fails
  dbStore.working.push(newItem);
  return newItem;
}

/**
 * Retrieves all active conversation turns for a given session from working_memory
 */
export async function getWorkingMemoryHistory(sessionId: string): Promise<WorkingMemoryItem[]> {
  const config = getDatabaseConfig();

  if (config.isStubbed) {
    return dbStore.working
      .filter((item) => item.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const sql = `
    SELECT id, user_id AS "userId", session_id AS "sessionId", role, content, topic_tag AS "topicTag", created_at AS "createdAt"
    FROM working_memory
    WHERE session_id = $1
    ORDER BY created_at ASC;
  `;

  try {
    const rows = await queryDB<WorkingMemoryItem>(sql, [sessionId]);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('[WorkingMemoryService] Failed to fetch history from DB, using fallback stub.', err);
  }

  return dbStore.working
    .filter((item) => item.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
