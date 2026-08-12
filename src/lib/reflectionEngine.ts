/**
 * NeuroMemory — Reflection Engine Module
 * Reads recent Episodic Memory entries for a session, groups them by conceptTags,
 * synthesizes concise reflection insights summarizing recurring patterns,
 * and persists the results to ReflectionMemory using Prisma transactions.
 */

import { prisma } from '@/lib/prisma';
import { ReflectionMemory, EpisodicMemory } from '@prisma/client';

export interface GenerateReflectionsOptions {
  limit?: number;
}

/**
 * Helper to determine the dominant emotion from a collection of memories.
 */
function determineDominantEmotion(memories: EpisodicMemory[]): string {
  const emotionCounts: Record<string, number> = {};
  for (const m of memories) {
    if (m.emotion) {
      emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
    }
  }

  let dominant = 'neutral';
  let maxCount = 0;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = emotion;
    }
  }

  return dominant;
}

/**
 * Generate reflections for a session by reading recent EpisodicMemory entries,
 * grouping them by concept tags, synthesizing insights on recurring patterns,
 * and saving ReflectionMemory records inside a Prisma transaction.
 *
 * @param sessionId - The session identifier to reflect upon.
 * @param options - Optional limit for reading recent episodic memories.
 * @returns Array of newly created ReflectionMemory records.
 */
export async function generateReflections(
  sessionId: string,
  options: GenerateReflectionsOptions = {}
): Promise<ReflectionMemory[]> {
  if (!sessionId) {
    throw new Error('sessionId is required for generateReflections.');
  }

  const limit = options.limit ?? 50;

  return await prisma.$transaction(async (tx) => {
    // 1. Read recent EpisodicMemory entries for the session
    const recentEpisodicMemories = await tx.episodicMemory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (recentEpisodicMemories.length === 0) {
      return [];
    }

    // 2. Group memories by conceptTags
    const groupsByTag: Map<string, EpisodicMemory[]> = new Map();

    for (const mem of recentEpisodicMemories) {
      const tags = mem.conceptTags && mem.conceptTags.length > 0 ? mem.conceptTags : ['general'];

      for (const tag of tags) {
        const normalizedTag = tag.trim().toLowerCase();
        if (!groupsByTag.has(normalizedTag)) {
          groupsByTag.set(normalizedTag, []);
        }
        // Avoid duplicate memory addition within the same tag group
        const existingGroup = groupsByTag.get(normalizedTag)!;
        if (!existingGroup.some((m) => m.id === mem.id)) {
          existingGroup.push(mem);
        }
      }
    }

    const createdReflections: ReflectionMemory[] = [];

    // 3. For each concept tag group, synthesize a reflection summarizing recurring patterns
    for (const [tag, memories] of groupsByTag.entries()) {
      const sourceEpisodicIds = memories.map((m) => m.id);
      const userId = memories.find((m) => m.userId)?.userId ?? null;

      // Calculate average importance score
      const totalImportance = memories.reduce((sum, m) => sum + (m.importanceScore ?? 0.5), 0);
      const avgImportance = Math.round((totalImportance / memories.length) * 100) / 100;

      const dominantEmotion = determineDominantEmotion(memories);

      // Synthesize insight & content summary
      const countLabel = memories.length === 1 ? '1 memory' : `${memories.length} memories`;
      const insight = `Recurring pattern for concept "${tag}": Synthesized from ${countLabel}.`;

      const contentsSummary = memories.map((m) => m.content).join(' | ');
      const content = `Reflection on ${tag}: ${contentsSummary}`;

      // 4. Check for existing ReflectionMemory for this session and tag (idempotency check)
      const existingReflection = await tx.reflectionMemory.findFirst({
        where: {
          sessionId,
          conceptTags: { has: tag },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingReflection) {
        const existingIds = existingReflection.sourceEpisodicIds || [];
        const isMatch =
          sourceEpisodicIds.length === existingIds.length &&
          sourceEpisodicIds.every((id) => existingIds.includes(id));

        if (isMatch) {
          createdReflections.push(existingReflection);
          continue;
        }
      }

      // Store result in ReflectionMemory with metadata referencing sourceEpisodicIds
      const reflection = await tx.reflectionMemory.create({
        data: {
          userId,
          sessionId,
          insight,
          content,
          importanceScore: avgImportance,
          emotion: dominantEmotion,
          conceptTags: [tag],
          sourceEpisodicIds,
          metadata: {
            sourceEpisodicIds,
            memoryCount: memories.length,
            conceptTag: tag,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      createdReflections.push(reflection);
    }

    return createdReflections;
  });
}
