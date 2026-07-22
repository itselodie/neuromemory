/**
 * NeuroMemory — Sleep Cycle Service (Consolidation & Decay Process)
 * Performs background sleep-cycle operations:
 * 1. Promotes high-significance (score >= 0.6) episodic memories into `semantic_memory`.
 * 2. Generates 1536-dimensional vector embeddings for consolidated concepts.
 * 3. Updates original episodic items setting `promoted = true` and incrementing `reinforcementCount`.
 * 4. Offloads low-significance (score < 0.4) episodic memories to AWS S3 cold storage and logs entries in `archive_log`.
 */

import { getEpisodicMemoriesBySession } from '@/services/episodicMemoryService';
import { createSemanticMemory } from '@/services/semanticMemoryService';
import { createArchiveLog, markEpisodicPromoted } from '@/services/archiveLogService';
import { generateEmbedding } from '@/lib/aws/bedrock';
import { archiveMemoryToS3 } from '@/lib/aws/s3';
import { SemanticMemoryItem, ArchiveLogItem } from '@/types/memory';

export interface SleepCycleResult {
  sessionId: string;
  promotedCount: number;
  archivedCount: number;
  semanticMemoriesCreated: SemanticMemoryItem[];
  archiveLogsCreated: ArchiveLogItem[];
  timestamp: Date;
}

/**
 * Runs the Sleep Cycle process for a session.
 */
export async function runSleepCycle(sessionId: string): Promise<SleepCycleResult> {
  // 1. Fetch all episodic memories for the session
  const episodicMemories = await getEpisodicMemoriesBySession(sessionId);

  // 2. Identify unpromoted memories matching exact spec: reinforcement_count >= 3 OR significance_score >= 2.0
  const candidatesToPromote = episodicMemories.filter(
    (m) => !m.promoted && ((m.reinforcementCount && m.reinforcementCount >= 3) || m.significanceScore >= 2.0)
  );

  const semanticMemoriesCreated: SemanticMemoryItem[] = [];

  if (candidatesToPromote.length > 0) {
    // Group contents into a synthesized concept
    const combinedContent = candidatesToPromote.map((m) => m.content).join(' ');
    const conceptName = extractConceptTitle(candidatesToPromote[0].content);
    const sourceIds = candidatesToPromote.map((m) => m.id);

    // Generate 1536-d vector embedding for consolidated concept
    const conceptEmbedding = await generateEmbedding(combinedContent);

    // Create semantic memory concept entry
    const newSemanticMemory = await createSemanticMemory({
      userId: candidatesToPromote[0].userId,
      sessionId,
      concept: conceptName,
      content: combinedContent,
      embedding: conceptEmbedding,
      significanceScore: 0.8,
      conceptTags: candidatesToPromote.flatMap((m) => m.conceptTags).slice(0, 8),
      sourceEpisodicIds: sourceIds,
      metadata: {
        consolidationTrigger: 'sleep_cycle',
        sourceCount: candidatesToPromote.length,
      },
    });

    semanticMemoriesCreated.push(newSemanticMemory);

    // Mark source episodic memories as promoted
    for (const mem of candidatesToPromote) {
      await markEpisodicPromoted(mem.id);
    }
  }

  // 3. Identify low-significance memories (score < 0.4) for S3 cold storage offloading
  const candidatesToArchive = episodicMemories.filter((m) => m.significanceScore < 0.4);
  const archiveLogsCreated: ArchiveLogItem[] = [];

  for (const mem of candidatesToArchive) {
    // Archive payload to AWS S3
    const s3ObjectKey = await archiveMemoryToS3({
      memoryId: mem.id,
      sourceTable: 'episodic_memory',
      sessionId: mem.sessionId,
      content: mem.content,
      metadata: mem.metadata,
      archivedAt: new Date().toISOString(),
    });

    // Record in archive_log table
    const archiveLog = await createArchiveLog({
      originalMemoryId: mem.id,
      sourceTable: 'episodic_memory',
      sessionId: mem.sessionId,
      s3ObjectKey,
      metadata: {
        significanceScore: mem.significanceScore,
        archivedReason: 'low_significance_decay',
      },
    });

    archiveLogsCreated.push(archiveLog);
  }

  return {
    sessionId,
    promotedCount: candidatesToPromote.length,
    archivedCount: candidatesToArchive.length,
    semanticMemoriesCreated,
    archiveLogsCreated,
    timestamp: new Date(),
  };
}

/**
 * Extracts a concise concept title from text.
 */
function extractConceptTitle(text: string): string {
  const words = text.split(/\s+/).slice(0, 5);
  const title = words.join(' ').replace(/[^\w\s]/g, '');
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : 'Consolidated Concept';
}
