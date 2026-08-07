/**
 * Live Test for Promotion Engine against CockroachDB
 */

import { prisma } from '../src/lib/prisma';
import { promoteWorkingMemory } from '../src/lib/promotionEngine';

async function runLiveTest() {
  const testSessionId = `test-promotion-${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;

  console.log(`Starting live test for promoteWorkingMemory with session: ${testSessionId}`);

  try {
    // 1. Seed test WorkingMemory records
    console.log('Seeding test WorkingMemory records...');
    const wmHigh1 = await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'user',
        content: 'I need to configure CockroachDB for high availability and vector search.',
        importanceScore: 0.95,
        emotion: 'curious',
        topicTag: 'database',
        promoted: false,
      },
    });

    const wmHigh2 = await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'assistant',
        content: 'Remember that CockroachDB requires setting schema_locked = false before altering tables watching changefeeds.',
        importanceScore: 0.85,
        emotion: 'informative',
        topicTag: 'database',
        promoted: false,
      },
    });

    const wmLow = await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'user',
        content: 'Hello, how are you today?',
        importanceScore: 0.30,
        emotion: 'neutral',
        topicTag: 'general',
        promoted: false,
      },
    });

    const wmAlreadyPromoted = await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'user',
        content: 'This memory was already promoted earlier.',
        importanceScore: 0.90,
        emotion: 'neutral',
        topicTag: 'general',
        promoted: true,
      },
    });

    console.log('Seeded WorkingMemory IDs:', {
      wmHigh1: wmHigh1.id,
      wmHigh2: wmHigh2.id,
      wmLow: wmLow.id,
      wmAlreadyPromoted: wmAlreadyPromoted.id,
    });

    // 2. Execute promoteWorkingMemory
    console.log('Executing promoteWorkingMemory...');
    const promotedMemories = await promoteWorkingMemory(testSessionId);

    console.log(`Promoted ${promotedMemories.length} memories to EpisodicMemory.`);

    // 3. Verifications
    // Check count
    if (promotedMemories.length !== 2) {
      throw new Error(`Expected 2 promoted memories, got ${promotedMemories.length}`);
    }

    // Verify fields preserved
    const ep1 = promotedMemories.find((m) => m.content === wmHigh1.content);
    if (!ep1) {
      throw new Error('wmHigh1 was not found in promoted EpisodicMemory list.');
    }
    if (ep1.userId !== testUserId) throw new Error(`UserId mismatch: ${ep1.userId} !== ${testUserId}`);
    if (ep1.sessionId !== testSessionId) throw new Error(`SessionId mismatch: ${ep1.sessionId} !== ${testSessionId}`);
    if (ep1.importanceScore !== 0.95) throw new Error(`Importance score mismatch: ${ep1.importanceScore} !== 0.95`);
    if (ep1.emotion !== 'curious') throw new Error(`Emotion mismatch: ${ep1.emotion} !== curious`);
    if (!ep1.conceptTags.includes('database')) throw new Error(`Concept tags mismatch: ${ep1.conceptTags}`);

    // Verify WorkingMemory status in DB
    const updatedWm1 = await prisma.workingMemory.findUnique({ where: { id: wmHigh1.id } });
    const updatedWm2 = await prisma.workingMemory.findUnique({ where: { id: wmHigh2.id } });
    const updatedWmLow = await prisma.workingMemory.findUnique({ where: { id: wmLow.id } });
    const updatedWmAlready = await prisma.workingMemory.findUnique({ where: { id: wmAlreadyPromoted.id } });

    if (updatedWm1?.promoted !== true) throw new Error('wmHigh1 promoted flag is not true in DB');
    if (updatedWm2?.promoted !== true) throw new Error('wmHigh2 promoted flag is not true in DB');
    if (updatedWmLow?.promoted === true) throw new Error('wmLow promoted flag should NOT be true in DB');

    console.log('✔ Initial promotion test passed.');

    // 4. Idempotency test (calling promoteWorkingMemory again should promote 0 new memories)
    console.log('Testing idempotency (second promotion call)...');
    const secondCallResults = await promoteWorkingMemory(testSessionId);
    if (secondCallResults.length !== 0) {
      throw new Error(`Expected 0 new promotions on second run, got ${secondCallResults.length}`);
    }
    console.log('✔ Idempotency test passed.');

    console.log('ALL LIVE TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Live test failed:', error);
    process.exit(1);
  } finally {
    // Clean up test data
    console.log('Cleaning up test data...');
    await prisma.episodicMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.workingMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runLiveTest();
