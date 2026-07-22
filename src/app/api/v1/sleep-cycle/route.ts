/**
 * NeuroMemory — Sleep Cycle API Route (/api/v1/sleep-cycle)
 * Triggers the cognitive sleep cycle consolidation & decay process for a given session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSleepCycle } from '@/services/sleepCycleService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId = 'default_session' } = body;

    const result = await runSleepCycle(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Sleep cycle completed successfully',
      result,
    });
  } catch (error) {
    console.error('[Sleep Cycle API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run sleep cycle' },
      { status: 500 }
    );
  }
}
