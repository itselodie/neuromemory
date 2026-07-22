/**
 * NeuroMemory — Memory Search & Recall API Route (/api/v1/memories/search)
 * Executes prioritized hybrid memory retrieval across Working, Semantic, and Episodic tiers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchMemories } from '@/services/recallService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sessionId, limit = 3 } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Query text is required for memory recall' },
        { status: 400 }
      );
    }

    const recallResult = await searchMemories(query.trim(), sessionId, limit);

    return NextResponse.json({
      success: true,
      result: recallResult,
    });
  } catch (error) {
    console.error('[Memory Search API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform memory search' },
      { status: 500 }
    );
  }
}
