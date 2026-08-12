/**
 * NeuroMemory — Semantic Engine Module
 * Reads ReflectionMemory records for a session, merges related reflections into long-term concepts,
 * prevents duplicate concepts by updating existing SemanticMemory entries,
 * increments reinforcement counts, tracks source Reflection & Episodic references,
 * and executes operations within Prisma transactions.
 */

import { prisma } from '@/lib/prisma';
import { SemanticMemory, ReflectionMemory } from '@prisma/client';

export interface BuildSemanticMemoryOptions {
  limit?: number;
}

/**
 * Builds long-term SemanticMemory concepts from session ReflectionMemory records.
 *
 * @param sessionId - The session identifier to consolidate reflections for.
 * @param options - Optional parameters (e.g. limit on reflection records).
 * @returns Array of newly created or updated SemanticMemory records.
 */
export async function buildSemanticMemory(
  sessionId: string,
  options: BuildSemanticMemoryOptions = {}
): Promise<SemanticMemory[]> {
  if (!sessionId) {
    throw new Error('sessionId is required for buildSemanticMemory.');
  }

  const limit = options.limit ?? 50;

  return await prisma.$transaction(async (tx) => {
    // 1. Read ReflectionMemory records for the session
    const reflections = await tx.reflectionMemory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    if (reflections.length === 0) {
      return [];
    }

    // 2. Group reflections by concept tag
    const reflectionsByConcept: Map<string, ReflectionMemory[]> = new Map();

    for (const ref of reflections) {
      const tags = ref.conceptTags && ref.conceptTags.length > 0 ? ref.conceptTags : ['general'];

      for (const tag of tags) {
        const conceptKey = tag.trim().toLowerCase();
        if (!reflectionsByConcept.has(conceptKey)) {
          reflectionsByConcept.set(conceptKey, []);
        }
        const group = reflectionsByConcept.get(conceptKey)!;
        if (!group.some((r) => r.id === ref.id)) {
          group.push(ref);
        }
      }
    }

    const results: SemanticMemory[] = [];

    // 3. Consolidate each concept group into SemanticMemory
    for (const [conceptKey, conceptReflections] of reflectionsByConcept.entries()) {
      const userId = conceptReflections.find((r) => r.userId)?.userId ?? null;

      // Extract source Reflection IDs & unique Episodic Memory IDs
      const sourceReflectionIds = conceptReflections.map((r) => r.id);
      const sourceEpisodicIds = Array.from(
        new Set(conceptReflections.flatMap((r) => r.sourceEpisodicIds ?? []))
      );

      // Aggregate concept tags across reflections
      const conceptTags = Array.from(
        new Set(conceptReflections.flatMap((r) => r.conceptTags ?? []))
      );

      // Merge reflection contents & insights into a long-term concept summary
      const mergedContent = conceptReflections
        .map((r) => `${r.insight} ${r.content}`)
        .join(' | ');

      // Average importance score
      const totalImportance = conceptReflections.reduce((sum, r) => sum + (r.importanceScore ?? 0.5), 0);
      const avgImportance = Math.round((totalImportance / conceptReflections.length) * 100) / 100;

      const emotion = conceptReflections[conceptReflections.length - 1].emotion ?? 'neutral';

      // 4. Check for existing SemanticMemory for this concept (prevent duplicate concepts)
      const existingSemantic = await tx.semanticMemory.findFirst({
        where: {
          concept: conceptKey,
          OR: [
            { sessionId },
            ...(userId ? [{ userId }] : []),
          ],
        },
      });

      if (existingSemantic) {
        // 5a. Update existing SemanticMemory: check for uncollected reflections (idempotency check)
        const existingMetadata =
          typeof existingSemantic.metadata === 'object' && existingSemantic.metadata !== null
            ? (existingSemantic.metadata as Record<string, any>)
            : {};

        const previousReflectionIds: string[] = (existingMetadata.sourceReflectionIds as string[]) || [];
        const uncollectedReflections = conceptReflections.filter((r) => !previousReflectionIds.includes(r.id));

        if (uncollectedReflections.length === 0) {
          // All reflections for this concept group have already been consolidated
          results.push(existingSemantic);
          continue;
        }

        const uncollectedMergedContent = uncollectedReflections
          .map((r) => `${r.insight} ${r.content}`)
          .join(' | ');

        const updatedSourceEpisodic = Array.from(
          new Set([...(existingSemantic.sourceEpisodicIds ?? []), ...sourceEpisodicIds])
        );

        const updatedConceptTags = Array.from(
          new Set([...(existingSemantic.conceptTags ?? []), ...conceptTags])
        );

        const updatedReinforcement = (existingSemantic.reinforcementCount ?? 0) + uncollectedReflections.length;
        const newContent = `${existingSemantic.content} | ${uncollectedMergedContent}`;

        const updatedMetadata = {
          ...existingMetadata,
          sourceReflectionIds: Array.from(
            new Set([
              ...previousReflectionIds,
              ...sourceReflectionIds,
            ])
          ),
          sourceEpisodicIds: updatedSourceEpisodic,
          lastReinforcedAt: new Date().toISOString(),
          reinforcementHistoryCount: updatedReinforcement,
        };

        const updatedRecord = await tx.semanticMemory.update({
          where: { id: existingSemantic.id },
          data: {
            content: newContent,
            reinforcementCount: updatedReinforcement,
            significanceScore: Math.min(1.0, (existingSemantic.significanceScore ?? 0.5) + 0.1 * uncollectedReflections.length),
            importanceScore: avgImportance,
            conceptTags: updatedConceptTags,
            sourceEpisodicIds: updatedSourceEpisodic,
            lastAccessedAt: new Date(),
            metadata: updatedMetadata,
          },
        });

        results.push(updatedRecord);
      } else {
        // 5b. Create new SemanticMemory record
        const metadata = {
          sourceReflectionIds,
          sourceEpisodicIds,
          createdAtTimestamp: new Date().toISOString(),
          initialReflectionCount: conceptReflections.length,
        };

        const newRecord = await tx.semanticMemory.create({
          data: {
            userId,
            sessionId,
            concept: conceptKey,
            content: mergedContent,
            importanceScore: avgImportance,
            significanceScore: avgImportance,
            reinforcementCount: conceptReflections.length,
            conceptTags,
            sourceEpisodicIds,
            emotion,
            metadata,
          },
        });

        results.push(newRecord);
      }
    }

    return results;
  });
}
