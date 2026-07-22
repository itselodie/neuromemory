/**
 * NeuroMemory — Chat Service (AWS Bedrock & Mocked Responses)
 * Invokes AWS Bedrock Claude 3.5 Sonnet if credentials are valid,
 * otherwise provides contextual mocked AI assistant responses so the application remains 100% runnable offline.
 * Proactively surfaces highly relevant past memories and previous struggles directly in the response.
 */

import { getBedrockConfig } from '@/lib/aws/bedrock';

export interface ChatMessageTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MOCK_RESPONSES = [
  "I am NeuroMemory AI Assistant. I am tracking your prompt in CockroachDB's `working_memory` table.",
  "Your message has been saved as an active turn in `working_memory`. How can I assist you further?",
  "That is a great question! I am maintaining this session state across turns in the working memory buffer.",
  "NeuroMemory is currently processing this conversation turn.",
  "I have logged this response to your working memory context with active 3-tier recall across Working, Semantic, and Episodic memory!",
];

/**
 * Generates an assistant response for the active conversation history,
 * proactively surfacing highly relevant past memories/struggles directly to the user when recalled.
 */
export async function generateChatResponse(
  messages: ChatMessageTurn[],
  recalledContextPrompt?: string,
  surfacedConcept?: string
): Promise<string> {
  const config = getBedrockConfig();

  if (config.isStubbed) {
    // Artificial delay to simulate real network inference
    await new Promise((resolve) => setTimeout(resolve, 600));

    const userMessages = messages.filter((m) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    let proactivePrefix = '';
    if (surfacedConcept) {
      proactivePrefix = `Before we begin... I recall from your previous sessions that you discussed/struggled with "${surfacedConcept}", which is directly relevant to your current question.\n\n`;
    } else if (recalledContextPrompt && recalledContextPrompt.trim().length > 0) {
      proactivePrefix = `Before we begin... I recall relevant context from your previous memories.\n\n`;
    }

    // Smart contextual response generation for demo/testing
    if (lastUserMessage.toLowerCase().includes('hello') || lastUserMessage.toLowerCase().includes('hi')) {
      return `${proactivePrefix}Hello! Welcome back to NeuroMemory. I am ready to assist you using active 3-tier memory recall across Working, Semantic, and Episodic memory!`;
    }

    if (lastUserMessage.toLowerCase().includes('cockroach') || lastUserMessage.toLowerCase().includes('database')) {
      return `${proactivePrefix}CockroachDB powers NeuroMemory with VECTOR(1536) cosine similarity search and multi-region resilience across working_memory, episodic_memory, and semantic_memory tables!`;
    }

    if (lastUserMessage.toLowerCase().includes('aws') || lastUserMessage.toLowerCase().includes('bedrock')) {
      return `${proactivePrefix}AWS Bedrock drives our neural cognition and embedding pipelines. Right now, I am operating in stubbed mock mode until AWS credentials are provided!`;
    }

    const randomIndex = Math.abs(hashCode(lastUserMessage)) % MOCK_RESPONSES.length;
    return `${proactivePrefix}${MOCK_RESPONSES[randomIndex]}`;
  }

  // Live AWS Bedrock Claude invocation with explicit instruction to surface recalled memories
  try {
    // @ts-ignore - Optional SDK module loaded at runtime
    const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const client = new BedrockRuntimeClient({ region: config.region });

    const formattedMessages = messages.map((m) => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    }));

    // Inject system instructions requiring explicit proactive memory surfacing
    if (recalledContextPrompt) {
      const instruction = surfacedConcept
        ? `[CRITICAL NEUROMEMORY INSTRUCTION]: The user has highly relevant past memories regarding "${surfacedConcept}". You MUST open your response by proactively acknowledging this past memory/struggle (e.g. "Before we begin... I recall from your previous sessions that you struggled with ${surfacedConcept}, which is relevant here."). Then answer their prompt.\n\n[RECALLED CONTEXT]:\n${recalledContextPrompt}`
        : `[RECALLED CONTEXT]:\n${recalledContextPrompt}\nIf any of the above memories are directly relevant, open your response by explicitly acknowledging the relevant past context to the user.`;

      formattedMessages.unshift({
        role: 'user',
        content: instruction,
      });
    }

    const promptPayload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: formattedMessages,
    };

    const command = new InvokeModelCommand({
      modelId: config.llmModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(promptPayload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0]?.text || "I'm sorry, I couldn't process that response.";
  } catch (error) {
    console.warn('[ChatService Warning] Bedrock invocation failed. Falling back to mocked response.', error);
    return MOCK_RESPONSES[0];
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
