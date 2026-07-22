/**
 * NeuroMemory — CockroachDB Vector Search Utilities
 * Formats vector arrays for PostgreSQL/CockroachDB VECTOR(1536) columns and calculates
 * local vector similarity metrics.
 */

export const VECTOR_DIMENSION = 1536;

/**
 * Formats a 1536-dim numeric array into CockroachDB SQL string format e.g. '[0.1, 0.2, ...]'
 */
export function formatVectorParam(vector: number[]): string {
  if (!vector || vector.length === 0) {
    // Generate a default 1536-dimensional zero vector if empty
    return `[${new Array(VECTOR_DIMENSION).fill(0).join(',')}]`;
  }

  if (vector.length !== VECTOR_DIMENSION) {
    console.warn(`[Vector Warning] Vector length ${vector.length} does not match expected dimension ${VECTOR_DIMENSION}. Padding/truncating.`);
    if (vector.length < VECTOR_DIMENSION) {
      const padded = [...vector, ...new Array(VECTOR_DIMENSION - vector.length).fill(0)];
      return `[${padded.join(',')}]`;
    }
    return `[${vector.slice(0, VECTOR_DIMENSION).join(',')}]`;
  }

  return `[${vector.join(',')}]`;
}

/**
 * Calculates Cosine Similarity between two numeric vectors locally (for stub/fallback execution)
 * Returns a score between -1.0 and 1.0 (higher = more similar)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
