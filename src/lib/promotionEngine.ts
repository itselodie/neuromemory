/**
 * NeuroMemory — Promotion Engine Module
 * Handles automatic promotion of high-importance Working Memory entries (importanceScore >= 0.8)
 * into Episodic Memory using Prisma transactions.
 */

import { prisma } from '@/lib/prisma';
import { EpisodicMemory } from '@prisma/client';

/**
 * Promotes eligible WorkingMemory records (importanceScore >= 0.8 and not previously promoted)
 * for a given session into EpisodicMemory.
 *
 * @param sessionId - The session identifier to process working memories for.
 * @returns Array of newly created EpisodicMemory records.
 */
export async function promoteWorkingMemory(sessionId: string): Promise<EpisodicMemory[]> {
  if (!sessionId) {
    throw new Error('sessionId is required for promoteWorkingMemory.');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch eligible WorkingMemory records for the given session:
    // - belongs to sessionId
    // - importanceScore >= 0.8
    // - not already promoted (promoted is false or null)
    const eligibleMemories = await tx.workingMemory.findMany({
      where: {
        sessionId,
        importanceScore: {
          gte: 0.8,
        },
        OR: [{ promoted: false }, { promoted: null }],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (eligibleMemories.length === 0) {
      return [];
    }

    const createdEpisodicMemories: EpisodicMemory[] = [];

    // 2. Process each eligible memory within the transaction
    for (const wm of eligibleMemories) {
      // Map WorkingMemory fields to EpisodicMemory schema
      const conceptTags = wm.topicTag ? [wm.topicTag] : [];
      const score = wm.importanceScore ?? 0.8;

      const episodic = await tx.episodicMemory.create({
        data: {
          userId: wm.userId,
          sessionId: wm.sessionId,
          content: wm.content,
          importanceScore: score,
          significanceScore: score,
          emotion: wm.emotion,
          conceptTags,
          metadata: {
            sourceWorkingMemoryId: wm.id,
            role: wm.role,
          },
        },
      });

      // 3. Mark the WorkingMemory record as promoted to prevent duplicate promotion
      await tx.workingMemory.update({
        where: { id: wm.id },
        data: { promoted: true },
      });

      createdEpisodicMemories.push(episodic);
    }

    return createdEpisodicMemories;
  });
}
