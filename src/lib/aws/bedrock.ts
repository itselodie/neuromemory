/**
 * NeuroMemory — AWS Bedrock SDK Wrapper & Stub Client
 * Handles text embedding generation (VECTOR(1536)) and LLM inference for consolidation.
 * Automatically falls back to deterministic stub vector generation when AWS credentials are not set.
 */

import { VECTOR_DIMENSION } from '@/lib/cockroach/vector';

export interface BedrockConfig {
  region: string;
  embeddingModelId: string;
  llmModelId: string;
  isStubbed: boolean;
}

export function getBedrockConfig(): BedrockConfig {
  const region = process.env.AWS_REGION || 'us-east-1';
  const hasCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  return {
    region,
    embeddingModelId: process.env.BEDROCK_EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v2:0',
    llmModelId: process.env.BEDROCK_LLM_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    isStubbed: !hasCreds,
  };
}

/**
 * Generates a 1536-dimensional vector embedding for a given text prompt.
 * Uses AWS Bedrock Runtime SDK when credentials are configured, or a deterministic hash vector stub when offline.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getBedrockConfig();

  if (config.isStubbed) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AWS Bedrock STUB] Generating 1536-d mock embedding for text: "${text.slice(0, 40)}..."`);
    }
    return generateDeterministicStubVector(text);
  }

  try {
    // @ts-ignore - Optional SDK dependency loaded at runtime
    const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const client = new BedrockRuntimeClient({ region: config.region });

    const payload = {
      inputText: text,
      dimensions: VECTOR_DIMENSION, // 1536
      normalize: true,
    };

    const command = new InvokeModelCommand({
      modelId: config.embeddingModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.embedding as number[];
  } catch (error) {
    console.warn('[AWS Bedrock Warning] Failed to invoke Bedrock embedding model. Using stub fallback.', error);
    return generateDeterministicStubVector(text);
  }
}

/**
 * Generates a normalized 1536-dimensional vector deterministically based on input text string.
 */
function generateDeterministicStubVector(text: string): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    const seed = (hash + i * 31) % 1000;
    vector[i] = Math.sin(seed);
  }

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => (magnitude > 0 ? val / magnitude : 0));
}
