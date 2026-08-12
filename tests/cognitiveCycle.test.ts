/**
 * Live Integration Test for Automatic Cognitive Memory Cycle against CockroachDB
 */

import { prisma } from '../src/lib/prisma';
import { executeCognitiveCycle, autoTriggerCognitiveCycle } from '../src/lib/cognitiveCycle';

async function runCognitiveCycleTest() {
  const testSessionId = `test-cognitive-cycle-${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;

  console.log(`Starting live integration test for executeCognitiveCycle with session: ${testSessionId}`);

  try {
    // --------------------------------------------------------------------------
    // 1. Seed WorkingMemory turns for multi-turn conversation simulation
    // --------------------------------------------------------------------------
    console.log('Seeding initial high-importance WorkingMemory turns...');

    const wm1 = await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'user',
        content: 'How do I optimize vector search queries in CockroachDB?',
        importanceScore: 0.92,
        emotion: 'curious',
        topicTag: 'database',
        promoted: false,
      },
    });

    const wm2 = await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'assistant',
        content: 'Use composite indexes and cosine similarity on VECTOR(1536) columns in CockroachDB.',
        importanceScore: 0.88,
        emotion: 'informative',
        topicTag: 'database',
        promoted: false,
      },
    });

    console.log('Seeded WorkingMemory turn IDs:', { wm1: wm1.id, wm2: wm2.id });

    // --------------------------------------------------------------------------
    // 2. Execute First Cognitive Memory Cycle
    // --------------------------------------------------------------------------
    console.log('Executing executeCognitiveCycle (Run 1)...');
    const result1 = await executeCognitiveCycle(testSessionId);

    console.log('Cycle Run 1 Results:', {
      promotedCount: result1.promotedCount,
      reflectionCount: result1.reflectionCount,
      semanticCount: result1.semanticCount,
    });

    // Verification Stage 1: Working -> Episodic Promotion
    if (result1.promotedCount !== 2) {
      throw new Error(`Expected 2 promoted memories in Stage 1, got ${result1.promotedCount}`);
    }

    const updatedWm1 = await prisma.workingMemory.findUnique({ where: { id: wm1.id } });
    const updatedWm2 = await prisma.workingMemory.findUnique({ where: { id: wm2.id } });

    if (!updatedWm1?.promoted || !updatedWm2?.promoted) {
      throw new Error('WorkingMemory records were not marked as promoted in DB.');
    }
    console.log('✔ Stage 1 (Working -> Episodic Promotion) verified.');

    // Verification Stage 2: Episodic -> Reflection Synthesis
    if (result1.reflectionCount !== 1) {
      throw new Error(`Expected 1 synthesized reflection in Stage 2, got ${result1.reflectionCount}`);
    }
    const dbReflections = await prisma.reflectionMemory.findMany({ where: { sessionId: testSessionId } });
    if (dbReflections.length !== 1 || !dbReflections[0].conceptTags.includes('database')) {
      throw new Error('ReflectionMemory record not persisted correctly for concept "database".');
    }
    console.log('✔ Stage 2 (Episodic -> Reflection Synthesis) verified.');

    // Verification Stage 3: Reflection -> Semantic Consolidation
    if (result1.semanticCount !== 1) {
      throw new Error(`Expected 1 consolidated semantic memory in Stage 3, got ${result1.semanticCount}`);
    }
    const dbSemantics = await prisma.semanticMemory.findMany({ where: { sessionId: testSessionId } });
    if (dbSemantics.length !== 1 || dbSemantics[0].concept !== 'database') {
      throw new Error('SemanticMemory record not consolidated correctly for concept "database".');
    }
    console.log('✔ Stage 3 (Reflection -> Semantic Consolidation) verified.');

    // --------------------------------------------------------------------------
    // 3. Safety & Idempotency Test (Run 2 on identical state)
    // --------------------------------------------------------------------------
    console.log('Executing executeCognitiveCycle (Run 2 - Idempotency Check)...');
    const result2 = await executeCognitiveCycle(testSessionId);

    console.log('Cycle Run 2 Results:', {
      promotedCount: result2.promotedCount,
      reflectionCount: result2.reflectionCount,
      semanticCount: result2.semanticCount,
    });

    if (result2.promotedCount !== 0) {
      throw new Error(`Expected 0 new promotions on duplicate cycle call, got ${result2.promotedCount}`);
    }

    const totalEpisodics = await prisma.episodicMemory.findMany({ where: { sessionId: testSessionId } });
    if (totalEpisodics.length !== 2) {
      throw new Error(`Expected total 2 EpisodicMemory records in DB, got ${totalEpisodics.length}`);
    }

    const totalReflections = await prisma.reflectionMemory.findMany({ where: { sessionId: testSessionId } });
    if (totalReflections.length !== 1) {
      throw new Error(`Expected total 1 ReflectionMemory record in DB, got ${totalReflections.length}`);
    }

    const totalSemantics = await prisma.semanticMemory.findMany({ where: { sessionId: testSessionId } });
    if (totalSemantics.length !== 1) {
      throw new Error(`Expected total 1 SemanticMemory record in DB, got ${totalSemantics.length}`);
    }

    console.log('✔ Cognitive cycle idempotency test passed successfully.');

    // --------------------------------------------------------------------------
    // 4. Turn-Interval Auto-Trigger Test
    // --------------------------------------------------------------------------
    console.log('Testing autoTriggerCognitiveCycle turn interval behavior...');
    
    // Seed 2 additional working memory turns (total turns = 4, turnInterval = 2 -> 4 % 2 === 0)
    await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'user',
        content: 'How do I secure CockroachDB connections using SSL mode?',
        importanceScore: 0.91,
        emotion: 'curious',
        topicTag: 'auth',
        promoted: false,
      },
    });

    await prisma.workingMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        role: 'assistant',
        content: 'Configure sslmode=verify-full with client certificates for CockroachDB clusters.',
        importanceScore: 0.89,
        emotion: 'informative',
        topicTag: 'auth',
        promoted: false,
      },
    });

    const autoTriggerResult = await autoTriggerCognitiveCycle(testSessionId, { turnInterval: 2 });
    if (!autoTriggerResult) {
      throw new Error('autoTriggerCognitiveCycle should have triggered for turn count 4 with interval 2.');
    }

    if (autoTriggerResult.promotedCount !== 2) {
      throw new Error(`Expected 2 promoted memories in auto-trigger, got ${autoTriggerResult.promotedCount}`);
    }

    console.log('✔ autoTriggerCognitiveCycle test passed successfully.');
    console.log('ALL AUTOMATIC COGNITIVE CYCLE INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  } finally {
    console.log('Cleaning up test data...');
    await prisma.workingMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.episodicMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.reflectionMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.semanticMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runCognitiveCycleTest();
