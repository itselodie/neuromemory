/**
 * NeuroMemory — Chat API Route (/api/v1/chat)
 * Receives user chat input, saves user & assistant turns into `working_memory`,
 * executes 3-tier memory recall across Working, Semantic, and Episodic memory,
 * proactively surfaces highly relevant past memories/struggles directly to the user,
 * processes turns through the episodic memory pipeline,
 * and returns the updated working memory history with recalled memory metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveWorkingMemoryTurn, getWorkingMemoryHistory } from '@/services/workingMemoryService';
import { generateChatResponse } from '@/services/chatService';
import { processTurnForEpisodicMemory } from '@/services/episodicPipeline';
import { searchMemories } from '@/services/recallService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') || 'default_session';

  try {
    const history = await getWorkingMemoryHistory(sessionId);
    return NextResponse.json({ success: true, sessionId, history });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve working memory history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId = 'default_session', userId = 'default_user', content, topicTag = 'general' } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    // 1. Fetch existing session history before inserting new turn
    const previousHistory = await getWorkingMemoryHistory(sessionId);
    const sessionHistoryContents = previousHistory.map((m) => m.content);

    // 2. Save user turn into working_memory (unchanged)
    const userTurn = await saveWorkingMemoryTurn({
      sessionId,
      userId,
      role: 'user',
      content: content.trim(),
      topicTag,
    });

    // 3. Execute 3-tier memory recall (Working -> Semantic -> Episodic)
    const recallResult = await searchMemories(content.trim(), sessionId, 3);

    // Identify top concept to proactively surface if vector similarity threshold >= 0.4
    let surfacedConcept: string | undefined = undefined;
    const topSemantic = recallResult.semanticMemoryMatches[0];
    const topEpisodic = recallResult.episodicMemoryMatches[0];

    if (topSemantic && topSemantic.similarity >= 0.4) {
      surfacedConcept = topSemantic.memory.concept;
    } else if (topEpisodic && topEpisodic.similarity >= 0.4) {
      const words = topEpisodic.memory.content.split(/\s+/).slice(0, 4).join(' ');
      surfacedConcept = words;
    }

    // 4. Process user turn through Episodic Memory Pipeline
    const userEpisodicResult = await processTurnForEpisodicMemory(userTurn, sessionHistoryContents);

    // 5. Fetch full working memory session history for LLM prompt
    const history = await getWorkingMemoryHistory(sessionId);

    // 6. Generate assistant response (proactively surfacing recalled past memory/struggle to the user)
    const assistantContent = await generateChatResponse(
      history.map((item) => ({ role: item.role, content: item.content })),
      recallResult.formattedContextPrompt,
      surfacedConcept
    );

    // 7. Save assistant reply turn into working_memory (unchanged)
    const assistantTurn = await saveWorkingMemoryTurn({
      sessionId,
      userId,
      role: 'assistant',
      content: assistantContent,
      topicTag,
    });

    // 8. Process assistant turn through Episodic Memory Pipeline
    const assistantEpisodicResult = await processTurnForEpisodicMemory(assistantTurn, [
      ...sessionHistoryContents,
      userTurn.content,
    ]);

    // 9. Fetch updated complete working memory history
    const updatedHistory = await getWorkingMemoryHistory(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      userTurn,
      assistantTurn,
      history: updatedHistory,
      surfacedConcept: surfacedConcept || null,
      recalledMemories: {
        semanticCount: recallResult.semanticMemoryMatches.length,
        episodicCount: recallResult.episodicMemoryMatches.length,
        semanticMatches: recallResult.semanticMemoryMatches.map((m) => ({
          concept: m.memory.concept,
          similarity: m.similarity,
        })),
        episodicMatches: recallResult.episodicMemoryMatches.map((m) => ({
          id: m.memory.id,
          similarity: m.similarity,
          hybridScore: m.hybridScore,
        })),
      },
      episodicProcessing: {
        userMemory: {
          id: userEpisodicResult.episodicMemory?.id,
          significanceScore: userEpisodicResult.significanceScore,
        },
        assistantMemory: {
          id: assistantEpisodicResult.episodicMemory?.id,
          significanceScore: assistantEpisodicResult.significanceScore,
        },
      },
    });
  } catch (error) {
    console.error('[Chat API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
