/**
 * Cross-session persistence test.
 * Verify: store a fact → restart (new MemoryDB instance) → fact is retrieved.
 * Run: cd harness && npx ts-node tests/memory-persistence.test.ts
 */
import { initDatabase } from '../src/memory/schema';
import { MemoryDB } from '../src/memory/MemoryDB';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = '/tmp/xentient_test.db';

async function runTest() {
  // Cleanup
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);

  console.log('TEST 1: Store fact in Session 1');
  const db1 = initDatabase(TEST_DB_PATH);
  const memory1 = new MemoryDB(db1);
  memory1.saveFact('identity', 'name', 'David', 0.95);
  memory1.saveTurn('user', 'Hi, my name is David');
  memory1.saveTurn('assistant', 'Nice to meet you, David!');
  memory1.endSession(1);
  db1.close();
  console.log('  ✓ Fact saved, session closed');

  console.log('TEST 2: Retrieve fact in Session 2 (simulating restart)');
  const db2 = initDatabase(TEST_DB_PATH);
  const memory2 = new MemoryDB(db2);

  const name = memory2.getUserName();
  if (name !== 'David') {
    console.error(`  ✗ FAIL: Expected 'David', got '${name}'`);
    process.exit(1);
  }
  console.log(`  ✓ User name persisted: "${name}"`);

  const episodes = memory2.searchEpisodes(['name', 'David'], 5);
  if (episodes.length === 0) {
    console.error('  ✗ FAIL: Episode search returned 0 results');
    process.exit(1);
  }
  console.log(`  ✓ Episode search returned ${episodes.length} result(s)`);

  console.log('TEST 3: FTS5 search keywords');
  const results = memory2.searchEpisodes(['meet'], 5);
  if (results.length === 0) {
    console.error('  ✗ FAIL: Keyword "meet" search returned 0 results');
    process.exit(1);
  }
  console.log(`  ✓ FTS5 keyword search works: ${results.length} result(s)`);

  db2.close();

  // Cleanup
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
  console.log('\n✅ ALL MEMORY PERSISTENCE TESTS PASSED');
}

runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});