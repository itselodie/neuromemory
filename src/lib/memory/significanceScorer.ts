/**
 * NeuroMemory — Significance Scoring Module
 * Pure, deterministic calculation of episodic memory significance score.
 * Formula strictly follows specification:
 *   score = base_weight(event_type)
 *         + 0.5 if user explicitly struggled or requested repetition
 *         + 0.3 if the topic recurs within the current session
 *         + 0.2 if the user explicitly says "remember this" (or equivalent)
 */

export type EventType = 'user_message' | 'assistant_message' | 'explicit_request' | 'system_event';

export interface ScoringContext {
  eventType: EventType;
  content: string;
  sessionHistory?: string[]; // Previous message contents in the current session
}

export interface ScoringResult {
  score: number;
  breakdown: {
    baseWeight: number;
    struggledOrRepeatBonus: number; // +0.5
    topicRecursionBonus: number;     // +0.3
    rememberThisBonus: number;       // +0.2
  };
}

/**
 * Computes the exact significance score for a given turn and context.
 */
export function calculateSignificanceScore(context: ScoringContext): ScoringResult {
  const contentLower = context.content.toLowerCase();

  // 1. Base weight by event type
  let baseWeight = 0.3;
  switch (context.eventType) {
    case 'user_message':
      baseWeight = 0.3;
      break;
    case 'assistant_message':
      baseWeight = 0.2;
      break;
    case 'explicit_request':
      baseWeight = 0.5;
      break;
    case 'system_event':
      baseWeight = 0.1;
      break;
  }

  // 2. Check struggle or repetition request (+0.5)
  const struggleKeywords = [
    'confused',
    'don\'t understand',
    'dont understand',
    'hard to follow',
    'explain again',
    'repeat that',
    'repeat this',
    'say again',
    'stuck',
    'clarify',
    'trouble understanding',
    'pardon',
  ];
  const hasStruggledOrRepeat = struggleKeywords.some((kw) => contentLower.includes(kw));
  const struggledOrRepeatBonus = hasStruggledOrRepeat ? 0.5 : 0.0;

  // 3. Check topic recursion within current session history (+0.3)
  let hasTopicRecursion = false;
  if (context.sessionHistory && context.sessionHistory.length > 0) {
    // Extract key words (> 3 chars) from current message
    const words = contentLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'what', 'your', 'about'].includes(w));

    if (words.length > 0) {
      // Check if any word appeared in previous history turns
      const previousCombined = context.sessionHistory.join(' ').toLowerCase();
      hasTopicRecursion = words.some((word) => previousCombined.includes(word));
    }
  }
  const topicRecursionBonus = hasTopicRecursion ? 0.3 : 0.0;

  // 4. Check explicit "remember this" or equivalent (+0.2)
  const rememberKeywords = [
    'remember this',
    'remember that',
    'keep in mind',
    'dont forget',
    'don\'t forget',
    'save this',
    'note this',
    'memorize',
  ];
  const hasRememberThis = rememberKeywords.some((kw) => contentLower.includes(kw));
  const rememberThisBonus = hasRememberThis ? 0.2 : 0.0;

  // Final score calculation
  const totalScore = parseFloat((baseWeight + struggledOrRepeatBonus + topicRecursionBonus + rememberThisBonus).toFixed(2));

  return {
    score: totalScore,
    breakdown: {
      baseWeight,
      struggledOrRepeatBonus,
      topicRecursionBonus,
      rememberThisBonus,
    },
  };
}
