/**
 * NeuroMemory — AI Orchestrator Module
 * Coordinates end-to-end user chat interaction:
 * 1. Processes user turns via memoryManager.
 * 2. Retrieves active Working Memory, Reflection Memory, and Semantic Memory.
 * 3. Constructs context-augmented prompts for Gemini LLM.
 * 4. Dispatches to Gemini (or mocked provider).
 * 5. Saves assistant turn responses back into Working Memory.
 */

import { prisma } from '@/lib/prisma';
import { processConversationTurn } from '@/lib/memoryManager';
import { WorkingMemory, ReflectionMemory, SemanticMemory } from '@prisma/client';

export interface RetrievedMemories {
  workingMemories: WorkingMemory[];
  reflectionMemories: ReflectionMemory[];
  semanticMemories: SemanticMemory[];
}

import { autoTriggerCognitiveCycle } from '@/lib/cognitiveCycle';

export interface ChatWithMemoryOptions {
  userId?: string;
  mockGeminiResponse?: string;
  geminiProvider?: (prompt: string) => Promise<string>;
  cycleInterval?: number;
}

/**
 * Retrieve active Working, Reflection, and Semantic memory records for a session.
 */
export async function retrieveSessionMemories(sessionId: string): Promise<RetrievedMemories> {
  const [workingMemories, reflectionMemories, semanticMemories] = await Promise.all([
    prisma.workingMemory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    }),
    prisma.reflectionMemory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.semanticMemory.findMany({
      where: {
        OR: [
          { sessionId },
          { sessionId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    workingMemories,
    reflectionMemories,
    semanticMemories,
  };
}

/**
 * Construct context-augmented prompt payload for Gemini.
 */
export function buildContextPrompt(
  userMessage: string,
  memories: RetrievedMemories
): string {
  let prompt = `System: You are an intelligent AI assistant powered by NeuroMemory context.\n\n`;

  if (memories.semanticMemories.length > 0) {
    prompt += `=== SEMANTIC MEMORY (CONSOLIDATED CONCEPTS) ===\n`;
    memories.semanticMemories.forEach((s, idx) => {
      prompt += `[Concept ${idx + 1}: ${s.concept}] ${s.content} (Reinforcement: ${s.reinforcementCount ?? 1}x)\n`;
    });
    prompt += `\n`;
  }

  if (memories.reflectionMemories.length > 0) {
    prompt += `=== REFLECTION MEMORY (RECURRING PATTERNS & INSIGHTS) ===\n`;
    memories.reflectionMemories.forEach((r, idx) => {
      prompt += `[Insight ${idx + 1}] ${r.insight} - ${r.content}\n`;
    });
    prompt += `\n`;
  }

  if (memories.workingMemories.length > 0) {
    prompt += `=== WORKING MEMORY (CONVERSATION HISTORY) ===\n`;
    memories.workingMemories.forEach((w) => {
      prompt += `${w.role}: ${w.content}\n`;
    });
    prompt += `\n`;
  }

  prompt += `=== CURRENT USER MESSAGE ===\nUser: ${userMessage}\n\nAssistant:`;

  return prompt;
}

/**
 * Dispatch prompt to Gemini API or fall back to mock response.
 * Strictly redacts and sanitizes any sensitive API keys from error tracebacks.
 */
export async function callGemini(prompt: string, mockResponse?: string): Promise<string> {
  if (mockResponse) {
    return mockResponse;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `[Gemini AI Response]: Received user prompt with active 3-tier memory context (Working, Reflection, Semantic).`;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Gemini API error with status ${res.status}: ${errorBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return responseText || '[Gemini AI Response]: Memory context processed.';
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const sanitizedMsg = apiKey ? rawMsg.split(apiKey).join('[REDACTED_API_KEY]') : rawMsg;
    console.warn('[AI Orchestrator] Gemini invocation failed, using fallback:', sanitizedMsg);
    return `[Gemini Fallback Response]: Processed prompt with memory context.`;
  }
}

import { RecalledMemoryMetadata } from '@/types/memory';

export interface ChatWithMemoryResult {
  response: string;
  recalledMemory: RecalledMemoryMetadata;
}

/**
 * Main Orchestration Function:
 * 1. Processes user message via memoryManager.
 * 2. Retrieves WorkingMemory, ReflectionMemory, and SemanticMemory for the session.
 * 3. Builds a context-augmented prompt.
 * 4. Sends prompt to Gemini (or mocked response provider).
 * 5. Saves assistant response into WorkingMemory.
 * 6. Automatically triggers cognitive memory cycle.
 * 7. Returns AI response with safe recalled memory metadata.
 */
export async function chatWithMemory(
  sessionId: string,
  userMessage: string,
  options?: ChatWithMemoryOptions | string
): Promise<ChatWithMemoryResult> {
  if (!sessionId || !userMessage) {
    throw new Error('sessionId and userMessage are required parameters for chatWithMemory.');
  }

  const opts: ChatWithMemoryOptions = typeof options === 'string' ? { userId: options } : (options ?? {});
  const { userId, mockGeminiResponse, geminiProvider } = opts;

  // Step 1: Process user message via memoryManager (analyzes & saves to WorkingMemory)
  await processConversationTurn(sessionId, 'user', userMessage, userId);

  // Step 2: Retrieve relevant WorkingMemory, ReflectionMemory, and SemanticMemory
  const memories = await retrieveSessionMemories(sessionId);

  // Step 3: Build context-augmented prompt
  const prompt = buildContextPrompt(userMessage, memories);

  // Step 4: Send prompt to Gemini (or custom/mock provider)
  let aiResponse: string;
  if (geminiProvider) {
    aiResponse = await geminiProvider(prompt);
  } else {
    aiResponse = await callGemini(prompt, mockGeminiResponse);
  }

  // Step 5: Save assistant response into WorkingMemory via memoryManager
  await processConversationTurn(sessionId, 'assistant', aiResponse, userId);

  // Step 6: Automatically trigger cognitive memory cycle after configurable turn interval
  try {
    await autoTriggerCognitiveCycle(sessionId, { turnInterval: opts.cycleInterval });
  } catch (err) {
    console.warn('[AI Orchestrator] Automatic cognitive cycle trigger warning:', err);
  }

  // Compute safe recalled memory metadata (no database IDs, API keys, or raw contents exposed)
  const reflectionTags = Array.from(
    new Set(memories.reflectionMemories.flatMap((r) => r.conceptTags ?? []))
  );
  const semanticConcepts = Array.from(
    new Set(memories.semanticMemories.map((s) => s.concept).filter(Boolean))
  );

  const recalledMemory: RecalledMemoryMetadata = {
    workingCount: memories.workingMemories.length,
    reflectionTags,
    semanticConcepts,
  };

  // Step 7: Return AI response payload with safe recalled memory metadata
  return {
    response: aiResponse,
    recalledMemory,
  };
}
