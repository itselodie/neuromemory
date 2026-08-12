import { NextRequest, NextResponse } from 'next/server';
import { chatWithMemory } from '@/lib/aiOrchestrator';

/**
 * POST /api/chat
 * API route handler for processing chat messages with 3-tier memory context.
 *
 * Expects JSON payload:
 * {
 *   "sessionId": string,
 *   "message": string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { sessionId, message, userId } = body || {};

    // Validate request parameters
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid "sessionId" parameter. Must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid "message" parameter. Must be a non-empty string.' },
        { status: 400 }
      );
    }

    // Process turn using AI orchestrator
    const result = await chatWithMemory(
      sessionId,
      message,
      typeof userId === 'string' && userId.trim() ? userId : undefined
    );

    const assistantResponseText = typeof result === 'string' ? result : result.response;
    const recalledMemory = typeof result === 'object' && result && 'recalledMemory' in result ? result.recalledMemory : undefined;

    return NextResponse.json({
      success: true,
      sessionId,
      response: assistantResponseText,
      assistantResponse: assistantResponseText,
      recalledMemory,
    });
  } catch (error) {
    console.error('[API Route /api/chat] Error handling request:', error);
    return NextResponse.json(
      {
        error: 'An internal server error occurred while processing the chat request.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
