/**
 * Live Integration Test for Semantic Engine against CockroachDB
 */

import { prisma } from '../src/lib/prisma';
import { buildSemanticMemory } from '../src/lib/semanticEngine';

async function runLiveTest() {
  const testSessionId = `test-semantic-${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;

  console.log(`Starting live test for buildSemanticMemory with session: ${testSessionId}`);

  try {
    // 1. Seed initial ReflectionMemory records
    console.log('Seeding initial ReflectionMemory records...');
    const r1 = await prisma.reflectionMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        insight: 'Pattern identified: CockroachDB query performance.',
        content: 'Multiple queries on CockroachDB require index optimization.',
        importanceScore: 0.85,
        emotion: 'curious',
        conceptTags: ['database'],
        sourceEpisodicIds: ['11111111-1111-4111-8111-111111111111'],
      },
    });

    const r2 = await prisma.reflectionMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        insight: 'Pattern identified: CockroachDB schema locking.',
        content: 'CockroachDB requires setting schema_locked = false before altering tables watching changefeeds.',
        importanceScore: 0.90,
        emotion: 'curious',
        conceptTags: ['database'],
        sourceEpisodicIds: ['22222222-2222-4222-8222-222222222222'],
      },
    });

    const r3 = await prisma.reflectionMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        insight: 'Pattern identified: JWT session authentication.',
        content: 'JWT tokens are validated per request in auth middleware.',
        importanceScore: 0.75,
        emotion: 'informative',
        conceptTags: ['auth'],
        sourceEpisodicIds: ['33333333-3333-4333-8333-333333333333'],
      },
    });

    console.log('Seeded ReflectionMemory IDs:', { r1: r1.id, r2: r2.id, r3: r3.id });

    // 2. Execute buildSemanticMemory (Initial Run)
    console.log('Executing buildSemanticMemory (Run 1)...');
    const semanticRun1 = await buildSemanticMemory(testSessionId);

    console.log(`Generated/Updated ${semanticRun1.length} SemanticMemory records.`);

    if (semanticRun1.length !== 2) {
      throw new Error(`Expected 2 semantic concepts (database, auth), got ${semanticRun1.length}`);
    }

    const dbConcept = semanticRun1.find((s) => s.concept === 'database');
    if (!dbConcept) {
      throw new Error('Semantic concept "database" not found.');
    }

    if (dbConcept.reinforcementCount !== 2) {
      throw new Error(`Expected reinforcementCount 2 for database, got ${dbConcept.reinforcementCount}`);
    }

    if (
      !dbConcept.sourceEpisodicIds.includes('11111111-1111-4111-8111-111111111111') ||
      !dbConcept.sourceEpisodicIds.includes('22222222-2222-4222-8222-222222222222')
    ) {
      throw new Error('Database concept missing sourceEpisodicIds.');
    }

    console.log('✔ Initial semantic memory build passed.');

    // 3. Test Reinforcement & Duplicate Prevention (Run 2)
    console.log('Seeding additional ReflectionMemory record for "database"...');
    const r4 = await prisma.reflectionMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        insight: 'Pattern identified: Database connection pooling.',
        content: 'Connection pooling prevents reaching CockroachDB max connection limits.',
        importanceScore: 0.88,
        emotion: 'curious',
        conceptTags: ['database'],
        sourceEpisodicIds: ['44444444-4444-4444-8444-444444444444'],
      },
    });

    console.log('Executing buildSemanticMemory (Run 2)...');
    const semanticRun2 = await buildSemanticMemory(testSessionId);

    // Total semantic records for session in DB should still be 2 (no duplicates created)
    const allDbSemantics = await prisma.semanticMemory.findMany({ where: { sessionId: testSessionId } });
    if (allDbSemantics.length !== 2) {
      throw new Error(`Expected total 2 semantic concepts in DB, got ${allDbSemantics.length}`);
    }

    const updatedDbConcept = allDbSemantics.find((s) => s.concept === 'database');
    if (!updatedDbConcept) {
      throw new Error('Updated database concept not found in DB.');
    }

    // Reinforcement count should have increased (2 + 3 = 5 or incremented properly)
    if ((updatedDbConcept.reinforcementCount ?? 0) <= 2) {
      throw new Error(`Expected reinforcementCount > 2, got ${updatedDbConcept.reinforcementCount}`);
    }

    if (!updatedDbConcept.sourceEpisodicIds.includes('44444444-4444-4444-8444-444444444444')) {
      throw new Error('Updated database concept missing newly added sourceEpisodicId.');
    }

    console.log('✔ Duplicate prevention and reinforcement test passed.');
    console.log('ALL LIVE SEMANTIC ENGINE TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Live test failed:', error);
    process.exit(1);
  } finally {
    console.log('Cleaning up test data...');
    await prisma.semanticMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.reflectionMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runLiveTest();
