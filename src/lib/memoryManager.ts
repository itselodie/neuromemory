/**
 * NeuroMemory — Memory Manager Module
 * Coordinates conversation turn processing, analysis (topic, emotion, importance),
 * and persistence to Working Memory via Prisma.
 */

import { saveWorkingMemory, SaveWorkingMemoryParams } from '@/lib/memory';
import { WorkingMemory } from '@prisma/client';
import { calculateSignificanceScore } from '@/lib/memory/significanceScorer';

export interface TurnAnalysisResult {
  importanceScore: number;
  topicTag: string;
  emotion: string;
}

export interface ProcessTurnResult {
  memory: WorkingMemory;
  analysis: TurnAnalysisResult;
}

/**
 * Detect emotional state/sentiment from message content.
 */
export function detectEmotion(content: string): string {
  if (!content || typeof content !== 'string') return 'neutral';
  const text = content.toLowerCase();

  // Emotion Keyword Rules
  if (/\b(thanks|thank you|appreciated|helpful|awesome|great|amazing|love|fantastic)\b/.test(text)) {
    return 'gratitude';
  }
  if (/\b(stuck|confused|error|fail|failed|failing|bug|broken|don't understand|dont understand|issue|trouble)\b/.test(text)) {
    return 'frustrated';
  }
  if (/\b(urgent|critical|help|emergency|asap|immediately)\b/.test(text)) {
    return 'anxious';
  }
  if (/\b(how|why|what|can you|explain|wondering|could you|\?)\b/.test(text)) {
    return 'curious';
  }
  if (/\b(wow|super|cool|excited|yay)\b/.test(text)) {
    return 'excited';
  }

  return 'neutral';
}

/**
 * Extract dominant topic or keyword tag from message content.
 */
export function extractTopic(content: string): string {
  if (!content || typeof content !== 'string') return 'general';
  const text = content.toLowerCase();

  // Rule-based domain topic matching
  const topicMap: Array<[RegExp, string]> = [
    [/\b(prisma|database|db|cockroach|cockroachdb|sql|postgres|schema|table)\b/, 'database'],
    [/\b(next|nextjs|react|component|page|router|frontend|ui|css)\b/, 'frontend'],
    [/\b(api|route|endpoint|http|backend|server|rest|grpc)\b/, 'backend'],
    [/\b(auth|login|token|jwt|session|security|permission)\b/, 'auth'],
    [/\b(aws|s3|bedrock|cloud|bucket|storage|deploy)\b/, 'cloud_infrastructure'],
    [/\b(memory|episodic|semantic|working|reflection|insight|vector|embedding)\b/, 'memory_system'],
    [/\b(error|bug|fix|debug|exception|crash)\b/, 'debugging'],
  ];

  for (const [pattern, topic] of topicMap) {
    if (pattern.test(text)) {
      return topic;
    }
  }

  // Fallback: extract the first significant word (> 4 characters)
  const words = text
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !['this', 'that', 'with', 'from', 'have', 'what', 'your', 'about', 'there', 'would', 'could'].includes(w));

  return words[0] || 'general';
}

/**
 * Calculate the importance score for a conversation turn.
 */
export function calculateImportanceScore(
  content: string,
  role: string,
  sessionHistory: string[] = []
): number {
  const eventType = role === 'user' ? 'user_message' : role === 'assistant' ? 'assistant_message' : 'system_event';

  const scoring = calculateSignificanceScore({
    eventType,
    content,
    sessionHistory,
  });

  // Clamp score between 0.0 and 1.0
  return Math.min(1.0, Math.max(0.0, scoring.score));
}

/**
 * Analyze a message to extract emotion, topic, and importance score.
 */
export function analyzeMessage(
  content: string,
  role: string,
  sessionHistory: string[] = []
): TurnAnalysisResult {
  const emotion = detectEmotion(content);
  const topicTag = extractTopic(content);
  const importanceScore = calculateImportanceScore(content, role, sessionHistory);

  return {
    importanceScore,
    topicTag,
    emotion,
  };
}

/**
 * Process a conversation turn:
 * 1. Analyzes message (topic, emotion, importance score).
 * 2. Saves result to Working Memory via Prisma.
 */
export async function processConversationTurn(
  sessionId: string,
  role: string,
  content: string,
  userId?: string | null,
  sessionHistory: string[] = []
): Promise<ProcessTurnResult> {
  if (!sessionId || !role || !content) {
    throw new Error('sessionId, role, and content are required parameters for processConversationTurn.');
  }

  // Perform turn analysis
  const analysis = analyzeMessage(content, role, sessionHistory);

  // Save to Working Memory
  const saveParams: SaveWorkingMemoryParams = {
    sessionId,
    role,
    content,
    userId: userId ?? null,
    topicTag: analysis.topicTag,
    importanceScore: analysis.importanceScore,
    emotion: analysis.emotion,
  };

  const memory = await saveWorkingMemory(saveParams);

  return {
    memory,
    analysis,
  };
}
