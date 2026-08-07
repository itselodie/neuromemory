/**
 * NeuroMemory — Memory Operations Service (Prisma)
 * Provides operations for Working Memory, Importance Scoring updates, and Expiration Cleanup.
 */

import { prisma } from '@/lib/prisma';
import { WorkingMemory, EpisodicMemory, SemanticMemory, ReflectionMemory } from '@prisma/client';

export type MemoryType = 'working' | 'episodic' | 'semantic' | 'reflection';

export interface SaveWorkingMemoryParams {
  sessionId: string;
  role: string;
  content: string;
  userId?: string | null;
  topicTag?: string | null;
  importanceScore?: number | null;
  emotion?: string | null;
}

export interface DeleteExpiredOptions {
  olderThanDays?: number;
  memoryType?: MemoryType | 'all';
}

/**
 * Save a new working memory entry into CockroachDB via Prisma.
 */
export async function saveWorkingMemory(params: SaveWorkingMemoryParams): Promise<WorkingMemory> {
  try {
    if (!params.sessionId || !params.role || !params.content) {
      throw new Error('sessionId, role, and content are required parameters.');
    }

    const newWorkingMemory = await prisma.workingMemory.create({
      data: {
        sessionId: params.sessionId,
        role: params.role,
        content: params.content,
        userId: params.userId ?? null,
        topicTag: params.topicTag ?? null,
        importanceScore: params.importanceScore ?? 0.5,
        emotion: params.emotion ?? null,
      },
    });

    return newWorkingMemory;
  } catch (error) {
    console.error('[Memory Service] Error saving working memory:', error);
    throw new Error(`Failed to save working memory: ${(error as Error).message}`);
  }
}

/**
 * Retrieve working memory entries for a given session sorted chronologically.
 */
export async function getWorkingMemory(sessionId: string, limit: number = 50): Promise<WorkingMemory[]> {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required.');
    }

    const records = await prisma.workingMemory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return records;
  } catch (error) {
    console.error(`[Memory Service] Error retrieving working memory for session ${sessionId}:`, error);
    throw new Error(`Failed to retrieve working memory: ${(error as Error).message}`);
  }
}

/**
 * Update the importance score for a memory record across memory types.
 */
export async function updateImportanceScore(
  id: string,
  score: number,
  memoryType: MemoryType = 'working'
): Promise<WorkingMemory | EpisodicMemory | SemanticMemory | ReflectionMemory> {
  try {
    if (!id) {
      throw new Error('Memory record id is required.');
    }

    if (typeof score !== 'number' || score < 0 || score > 1) {
      throw new Error('Importance score must be a number between 0.0 and 1.0.');
    }

    switch (memoryType) {
      case 'working':
        return await prisma.workingMemory.update({
          where: { id },
          data: { importanceScore: score },
        });
      case 'episodic':
        return await prisma.episodicMemory.update({
          where: { id },
          data: { importanceScore: score },
        });
      case 'semantic':
        return await prisma.semanticMemory.update({
          where: { id },
          data: { importanceScore: score },
        });
      case 'reflection':
        return await prisma.reflectionMemory.update({
          where: { id },
          data: { importanceScore: score },
        });
      default:
        throw new Error(`Unsupported memory type: ${memoryType}`);
    }
  } catch (error) {
    console.error(`[Memory Service] Error updating importance score for ${id}:`, error);
    throw new Error(`Failed to update importance score: ${(error as Error).message}`);
  }
}

/**
 * Delete expired memory entries older than a specified number of days.
 */
export async function deleteExpiredMemory(
  options: DeleteExpiredOptions = {}
): Promise<{ deletedCount: number; breakdown?: Record<string, number> }> {
  const { olderThanDays = 30, memoryType = 'working' } = options;

  try {
    if (olderThanDays <= 0) {
      throw new Error('olderThanDays must be greater than 0.');
    }

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    if (memoryType === 'all') {
      const [working, episodic, semantic, reflection] = await Promise.all([
        prisma.workingMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
        prisma.episodicMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
        prisma.semanticMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
        prisma.reflectionMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
      ]);

      const total = working.count + episodic.count + semantic.count + reflection.count;
      return {
        deletedCount: total,
        breakdown: {
          working: working.count,
          episodic: episodic.count,
          semantic: semantic.count,
          reflection: reflection.count,
        },
      };
    }

    let deletedCount = 0;
    switch (memoryType) {
      case 'working': {
        const result = await prisma.workingMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } });
        deletedCount = result.count;
        break;
      }
      case 'episodic': {
        const result = await prisma.episodicMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } });
        deletedCount = result.count;
        break;
      }
      case 'semantic': {
        const result = await prisma.semanticMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } });
        deletedCount = result.count;
        break;
      }
      case 'reflection': {
        const result = await prisma.reflectionMemory.deleteMany({ where: { createdAt: { lt: cutoffDate } } });
        deletedCount = result.count;
        break;
      }
    }

    return { deletedCount };
  } catch (error) {
    console.error('[Memory Service] Error deleting expired memories:', error);
    throw new Error(`Failed to delete expired memories: ${(error as Error).message}`);
  }
}
