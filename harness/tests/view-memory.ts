import { initDatabase } from '../src/memory/schema';
import { MemoryDB } from '../src/memory/MemoryDB';

const db = initDatabase();
const memoryDb = new MemoryDB(db);

const facts = memoryDb.getAllFacts();

console.log('\n=============================================');
console.log('🧠 XENTIENT SEMANTIC MEMORY VIEWER 🧠');
console.log('=============================================\n');

if (facts.length === 0) {
  console.log('🤷 No facts extracted yet. Go chat with Xentient first!');
} else {
  console.table(facts.map(f => ({
    Category: f.category.toUpperCase(),
    Key: f.key,
    Value: f.value,
    Confidence: `${(f.confidence * 100).toFixed(0)}%`,
    'Last Updated': new Date(f.updatedAt).toLocaleString()
  })));
}

console.log('\n=============================================');

// Also show the raw conversation logs (Episodic Memory)
const episodes = memoryDb.getRecentEpisodes(5);
if (episodes.length > 0) {
  console.log('\n📜 LAST 5 RAW CONVERSATION TURNS:');
  episodes.reverse().forEach(ep => {
    const icon = ep.role === 'user' ? '👤 You' : '🤖 AI';
    console.log(`\n[${new Date(ep.createdAt).toLocaleTimeString()}] ${icon}: ${ep.content}`);
  });
}

db.close();
