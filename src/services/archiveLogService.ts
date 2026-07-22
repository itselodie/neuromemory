/**
 * NeuroMemory — Archive Log Database Service
 * Manages database operations for the `archive_log` table in CockroachDB.
 * Schema: (id, original_memory_id, source_table, session_id, s3_object_key, archived_at, metadata)
 */

import { queryDB, dbStore, getDatabaseConfig } from '@/lib/cockroach/client';
import { ArchiveLogItem } from '@/types/memory';

export interface CreateArchiveLogInput {
  originalMemoryId: string;
  sourceTable: 'episodic_memory' | 'semantic_memory';
  sessionId?: string;
  s3ObjectKey: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an entry in the `archive_log` table.
 */
export async function createArchiveLog(input: CreateArchiveLogInput): Promise<ArchiveLogItem> {
  const config = getDatabaseConfig();
  const id = crypto.randomUUID();
  const archivedAt = new Date();

  const newItem: ArchiveLogItem = {
    id,
    originalMemoryId: input.originalMemoryId,
    sourceTable: input.sourceTable,
    sessionId: input.sessionId,
    s3ObjectKey: input.s3ObjectKey,
    archivedAt,
    metadata: input.metadata || {},
  };

  if (config.isStubbed) {
    dbStore.archive.push(newItem);
    return newItem;
  }

  const sql = `
    INSERT INTO archive_log (id, original_memory_id, source_table, session_id, s3_object_key, archived_at, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, original_memory_id AS "originalMemoryId", source_table AS "sourceTable",
              session_id AS "sessionId", s3_object_key AS "s3ObjectKey", archived_at AS "archivedAt", metadata;
  `;

  const params = [
    newItem.id,
    newItem.originalMemoryId,
    newItem.sourceTable,
    newItem.sessionId,
    newItem.s3ObjectKey,
    newItem.archivedAt,
    JSON.stringify(newItem.metadata),
  ];

  try {
    const rows = await queryDB<ArchiveLogItem>(sql, params);
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn('[ArchiveLogService] Failed to insert into CockroachDB, using fallback stub.', err);
  }

  dbStore.archive.push(newItem);
  return newItem;
}

/**
 * Updates episodic memory records setting promoted = true and updating reinforcement count
 */
export async function markEpisodicPromoted(memoryId: string): Promise<void> {
  const config = getDatabaseConfig();

  if (config.isStubbed) {
    const item = dbStore.episodic.find((m) => m.id === memoryId);
    if (item) {
      item.promoted = true;
      item.reinforcementCount += 1;
    }
    return;
  }

  const sql = `
    UPDATE episodic_memory
    SET promoted = TRUE, reinforcement_count = reinforcement_count + 1, last_accessed_at = clock_timestamp()
    WHERE id = $1;
  `;

  try {
    await queryDB(sql, [memoryId]);
  } catch (err) {
    console.warn('[ArchiveLogService] Failed to mark episodic memory promoted in DB.', err);
  }
}
