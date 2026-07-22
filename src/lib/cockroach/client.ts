/**
 * NeuroMemory — CockroachDB Connection & Client Handler
 * Supports live PostgreSQL / CockroachDB connection via pg/Pool with fallback stubbing
 * for offline development prior to credentials setup.
 */

import { WorkingMemoryItem, EpisodicMemoryItem, SemanticMemoryItem, ArchiveLogItem } from '@/types/memory';

// In-Memory Stubs for local execution when CockroachDB is not connected
const stubWorkingMemory: WorkingMemoryItem[] = [];
const stubEpisodicMemory: EpisodicMemoryItem[] = [];
const stubSemanticMemory: SemanticMemoryItem[] = [];
const stubArchiveLog: ArchiveLogItem[] = [];

export interface DBClientConfig {
  databaseUrl?: string;
  isStubbed: boolean;
}

export function getDatabaseConfig(): DBClientConfig {
  const url = process.env.DATABASE_URL;
  const isStubbed = !url || url.includes('localhost:26257') || process.env.USE_STUB_DB === 'true';
  return { databaseUrl: url, isStubbed };
}

/**
 * Execute raw query against CockroachDB or Stub Storage
 */
export async function queryDB<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const config = getDatabaseConfig();
  
  if (config.isStubbed) {
    // Console log in dev mode to track stubbed execution
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CockroachDB STUB Query]: ${sql.trim().slice(0, 80)}... (Params: ${params.length})`);
    }
    return [] as T[];
  }

  // Live CockroachDB connection logic (via pg pool when pg package is available)
  try {
    // @ts-ignore - Optional DB driver loaded at runtime
    const pg = await import('pg');
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    const result = await pool.query(sql, params);
    await pool.end();
    return result.rows as T[];
  } catch (error) {
    console.warn('[CockroachDB Warning] Failed to execute live DB query. Falling back to stub.', error);
    return [] as T[];
  }
}

export const dbStore = {
  working: stubWorkingMemory,
  episodic: stubEpisodicMemory,
  semantic: stubSemanticMemory,
  archive: stubArchiveLog,
};
