/**
 * NeuroMemory — Core Memory Data Models & Types
 * Matching exact 4-Table Architecture:
 * 1. working_memory  : Active conversation turns (user_id, session_id, role, content, topic_tag, created_at)
 * 2. episodic_memory : Vectorized interaction traces with significance scores
 * 3. semantic_memory : Consolidated knowledge concepts with vector embeddings & reinforcement counts
 * 4. archive_log     : Offloaded cold storage tracking for AWS S3
 */

/** 1. Working Memory item representation */
export interface WorkingMemoryItem {
  id: string;
  userId?: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  topicTag?: string;
  createdAt: Date;
}

/** Input DTO for adding to working memory */
export interface CreateWorkingMemoryInput {
  userId?: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  topicTag?: string;
}

/** 2. Episodic Memory item representation */
export interface EpisodicMemoryItem {
  id: string;
  userId?: string;
  sessionId: string;
  content: string;
  /** 1536-dimensional vector embedding */
  embedding?: number[];
  significanceScore: number;
  reinforcementCount: number;
  conceptTags: string[];
  promoted: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, unknown>;
}

/** Input DTO for creating an episodic memory */
export interface CreateEpisodicMemoryInput {
  userId?: string;
  sessionId: string;
  content: string;
  embedding?: number[];
  significanceScore?: number;
  conceptTags?: string[];
  metadata?: Record<string, unknown>;
}

/** 3. Semantic Memory item representation */
export interface SemanticMemoryItem {
  id: string;
  userId?: string;
  sessionId?: string;
  concept: string;
  content: string;
  /** 1536-dimensional vector embedding */
  embedding?: number[];
  significanceScore: number;
  reinforcementCount: number;
  conceptTags: string[];
  sourceEpisodicIds: string[];
  createdAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, unknown>;
}

/** Input DTO for creating a semantic memory concept */
export interface CreateSemanticMemoryInput {
  userId?: string;
  sessionId?: string;
  concept: string;
  content: string;
  embedding?: number[];
  significanceScore?: number;
  conceptTags?: string[];
  sourceEpisodicIds?: string[];
  metadata?: Record<string, unknown>;
}

/** 4. Archive Log item representation */
export interface ArchiveLogItem {
  id: string;
  originalMemoryId: string;
  sourceTable: 'episodic_memory' | 'semantic_memory';
  sessionId?: string;
  s3ObjectKey: string;
  archivedAt: Date;
  metadata?: Record<string, unknown>;
}

/** Hybrid Vector + Memory Search Query */
export interface MemorySearchQuery {
  sessionId?: string;
  userId?: string;
  queryText: string;
  queryEmbedding?: number[];
  limit?: number;
  minSignificanceScore?: number;
}
