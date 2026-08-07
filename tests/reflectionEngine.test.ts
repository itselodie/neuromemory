/**
 * Live Integration Test for Reflection Engine against CockroachDB
 */

import { prisma } from '../src/lib/prisma';
import { generateReflections } from '../src/lib/reflectionEngine';

async function runLiveTest() {
  const testSessionId = `test-reflection-${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;

  console.log(`Starting live test for generateReflections with session: ${testSessionId}`);

  try {
    // 1. Seed test EpisodicMemory records
    console.log('Seeding test EpisodicMemory records...');
    const ep1 = await prisma.episodicMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        content: 'Configured CockroachDB with Prisma ORM.',
        importanceScore: 0.90,
        significanceScore: 0.90,
        emotion: 'curious',
        conceptTags: ['database', 'prisma'],
      },
    });

    const ep2 = await prisma.episodicMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        content: 'Optimized database query performance with indexes.',
        importanceScore: 0.85,
        significanceScore: 0.85,
        emotion: 'curious',
        conceptTags: ['database'],
      },
    });

    const ep3 = await prisma.episodicMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        content: 'Designed reactive dashboard components using Next.js and Tailwind.',
        importanceScore: 0.80,
        significanceScore: 0.80,
        emotion: 'excited',
        conceptTags: ['frontend'],
      },
    });

    console.log('Seeded EpisodicMemory IDs:', { ep1: ep1.id, ep2: ep2.id, ep3: ep3.id });

    // 2. Execute generateReflections
    console.log('Executing generateReflections...');
    const reflections = await generateReflections(testSessionId);

    console.log(`Generated ${reflections.length} ReflectionMemory records.`);

    // 3. Verifications
    // Check count: should have groups for 'database', 'prisma', 'frontend' (total 3)
    if (reflections.length !== 3) {
      throw new Error(`Expected 3 reflections, got ${reflections.length}`);
    }

    // Verify 'database' reflection (should include ep1 and ep2)
    const dbReflection = reflections.find((r) => r.conceptTags.includes('database'));
    if (!dbReflection) {
      throw new Error('Reflection for concept "database" was not found.');
    }

    if (!dbReflection.sourceEpisodicIds.includes(ep1.id) || !dbReflection.sourceEpisodicIds.includes(ep2.id)) {
      throw new Error('Database reflection sourceEpisodicIds missing ep1 or ep2 ID.');
    }
    if (dbReflection.sourceEpisodicIds.length !== 2) {
      throw new Error(`Database reflection expected 2 source IDs, got ${dbReflection.sourceEpisodicIds.length}`);
    }
    if (dbReflection.emotion !== 'curious') {
      throw new Error(`Expected emotion curious, got ${dbReflection.emotion}`);
    }

    // Verify 'frontend' reflection (should include ep3)
    const frontendReflection = reflections.find((r) => r.conceptTags.includes('frontend'));
    if (!frontendReflection) {
      throw new Error('Reflection for concept "frontend" was not found.');
    }
    if (!frontendReflection.sourceEpisodicIds.includes(ep3.id)) {
      throw new Error('Frontend reflection missing ep3 ID.');
    }

    // Verify database persistence
    const dbReflectionsInDb = await prisma.reflectionMemory.findMany({
      where: { sessionId: testSessionId },
    });
    if (dbReflectionsInDb.length !== 3) {
      throw new Error(`Expected 3 records in DB for session, got ${dbReflectionsInDb.length}`);
    }

    console.log('✔ Live reflection engine test passed successfully!');
  } catch (error) {
    console.error('❌ Live test failed:', error);
    process.exit(1);
  } finally {
    // Clean up test data
    console.log('Cleaning up test data...');
    await prisma.reflectionMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.episodicMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runLiveTest();
