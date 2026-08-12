/**
 * Live Integration Test for AI Orchestrator & Gemini Provider Interface
 */

import { prisma } from '../src/lib/prisma';
import { chatWithMemory, callGemini } from '../src/lib/aiOrchestrator';

async function runIntegrationTest() {
  const testSessionId = `test-orchestrator-${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;

  console.log(`Starting live integration test for chatWithMemory with session: ${testSessionId}`);

  try {
    // --------------------------------------------------------------------------
    // Test 1: Verify Provider Safety & Fallback Behavior (Without API Key)
    // --------------------------------------------------------------------------
    console.log('Testing callGemini provider fallback without API key...');
    const originalApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const fallbackResponse = await callGemini('Test prompt');
    if (!fallbackResponse.includes('3-tier memory context')) {
      throw new Error(`Expected fallback response when GEMINI_API_KEY is missing, got: ${fallbackResponse}`);
    }
    console.log('✔ Gemini provider fallback test passed.');

    // --------------------------------------------------------------------------
    // Test 2: Verify Key Redaction Security in Error Tracebacks
    // --------------------------------------------------------------------------
    console.log('Testing API key redaction in error handling...');
    const fakeSecretKey = 'SECRET_TEST_KEY_12345';
    process.env.GEMINI_API_KEY = fakeSecretKey;

    // Trigger an error (invalid host or key) and verify key is NOT printed in output
    const consoleWarnLogs: string[] = [];
    const origWarn = console.warn;
    console.warn = (...args: any[]) => {
      consoleWarnLogs.push(args.join(' '));
    };

    await callGemini('Test security prompt');
    console.warn = origWarn;

    const leakedInLog = consoleWarnLogs.some(log => log.includes(fakeSecretKey));
    if (leakedInLog) {
      throw new Error('SECURITY FAILURE: Unsanitized GEMINI_API_KEY was found in warning/error log!');
    }
    console.log('✔ API key redaction security test passed.');

    // Restore original env key
    if (originalApiKey) {
      process.env.GEMINI_API_KEY = originalApiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }

    // --------------------------------------------------------------------------
    // Test 3: Seed Memory & Run Full chatWithMemory Context Assembly
    // --------------------------------------------------------------------------
    console.log('Seeding pre-existing Reflection & Semantic context...');
    await prisma.reflectionMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        insight: 'Pattern identified: High frequency database query performance tuning.',
        content: 'CockroachDB query performance benefits from composite index tuning.',
        conceptTags: ['database'],
      },
    });

    await prisma.semanticMemory.create({
      data: {
        sessionId: testSessionId,
        userId: testUserId,
        concept: 'database',
        content: 'CockroachDB supports SQL and VECTOR(1536) embedding search.',
        reinforcementCount: 3,
        conceptTags: ['database'],
      },
    });

    const mockResponseText = '[Mocked Gemini Response]: I acknowledge your query about CockroachDB query optimization and recalled your database reflections.';

    // Variable to capture the prompt built by aiOrchestrator and sent to Gemini
    let capturedPrompt = '';

    const geminiMockProvider = async (prompt: string): Promise<string> => {
      capturedPrompt = prompt;
      return mockResponseText;
    };

    // Execute chatWithMemory
    console.log('Executing chatWithMemory...');
    const userPromptText = 'How do I optimize CockroachDB query performance?';
    const response = await chatWithMemory(testSessionId, userPromptText, {
      userId: testUserId,
      geminiProvider: geminiMockProvider,
    });

    console.log('AI Orchestrator returned response:', response);

    const responseText = typeof response === 'string' ? response : response.response;

    // Verifications
    if (responseText !== mockResponseText) {
      throw new Error(`Expected returned response to match mock, got: ${responseText}`);
    }

    if (typeof response === 'object' && response.recalledMemory) {
      console.log('✔ Recalled memory metadata verified:', response.recalledMemory);
    }

    // Verify context prompt construction
    if (!capturedPrompt.includes('=== WORKING MEMORY') || !capturedPrompt.includes('=== REFLECTION MEMORY') || !capturedPrompt.includes('=== SEMANTIC MEMORY')) {
      throw new Error('Captured prompt did not contain expected 3-tier memory sections.');
    }
    if (!capturedPrompt.includes('CockroachDB supports SQL and VECTOR(1536)')) {
      throw new Error('Captured prompt missing recalled SemanticMemory content.');
    }
    if (!capturedPrompt.includes('composite index tuning')) {
      throw new Error('Captured prompt missing recalled ReflectionMemory content.');
    }

    console.log('✔ Prompt context assembly test passed.');

    // --------------------------------------------------------------------------
    // Test 4: Verify WorkingMemory entries saved in CockroachDB
    // --------------------------------------------------------------------------
    const workingRecords = await prisma.workingMemory.findMany({
      where: { sessionId: testSessionId },
      orderBy: { createdAt: 'asc' },
    });

    if (workingRecords.length !== 2) {
      throw new Error(`Expected 2 working memory records (user & assistant), got ${workingRecords.length}`);
    }

    const userTurn = workingRecords[0];
    const assistantTurn = workingRecords[1];

    if (userTurn.role !== 'user' || userTurn.content !== userPromptText) {
      throw new Error('User turn working memory record invalid.');
    }

    if (assistantTurn.role !== 'assistant' || assistantTurn.content !== mockResponseText) {
      throw new Error('Assistant turn working memory record invalid.');
    }

    console.log('✔ WorkingMemory persistence test passed.');
    console.log('ALL AI ORCHESTRATOR & GEMINI PROVIDER INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  } finally {
    console.log('Cleaning up test data...');
    await prisma.workingMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.reflectionMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.semanticMemory.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runIntegrationTest();
