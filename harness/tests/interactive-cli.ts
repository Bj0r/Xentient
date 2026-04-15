import { config } from 'dotenv';
import readline from 'readline';
import path from 'path';

import { OpenAIProvider } from '../src/providers/llm/OpenAIProvider';
import { initDatabase } from '../src/memory/schema';
import { MemoryDB } from '../src/memory/MemoryDB';
import { MemoryInjector } from '../src/memory/MemoryInjector';
import { FactExtractor } from '../src/memory/FactExtractor';

// Load keys from the global .env file
config({ path: path.join(process.cwd(), '../.env') }); 

async function main() {
  console.log('\n=============================================');
  console.log('🤖 XENTIENT BRAIN TESTER (MINIMAX EDITION) 🤖');
  console.log('=============================================\n');

  const apiKey = process.env.MINIMAX_API_KEY || '';
  if (!apiKey) {
    console.error('❌ ERROR: I need an API key to think!');
    console.error('   Please open your d:\\Projects\\Xentient\\.env file');
    console.error('   And add: MINIMAX_API_KEY=your_key_here');
    process.exit(1);
  }

  // 1. Initialize API and Memory
  const llm = new OpenAIProvider(apiKey, 'MiniMax-M2.7', 'https://api.minimax.io/v1');
  const db = initDatabase(); 
  const memoryDb = new MemoryDB(db);
  const extractor = new FactExtractor(llm, memoryDb); 
  const injector = new MemoryInjector(memoryDb, llm);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('✅ Brain Connected!');
  console.log('💡 Type anything to chat, and watch me remember things about you.\n');

  const ask = () => {
    rl.question('👤 You: ', async (text) => {
      text = text.trim();
      if (text.toLowerCase() === 'exit') {
        // Flush any pending fact extraction to DB before shutting down
        await extractor.flush();
        db.close();
        rl.close();
        process.exit(0);
      }
      if (!text) return ask();

      try {
        // 2. Fetch Context (inject memories into system prompt)
        const memoryContext = await injector.buildContext(text);
        
        // 3. Ask MiniMax LLM
        const stream = llm.complete([{ role: 'user', content: text }], memoryContext);
        
        process.stdout.write('🤖 Xentient: ');
        let fullResponse = '';
        for await (const token of stream) {
          process.stdout.write(token);
          fullResponse += token;
        }
        console.log('\n');
        
        // 4. Save to Memory
        memoryDb.saveTurn('user', text);
        memoryDb.saveTurn('assistant', fullResponse);
        
        // 5. Trigger autonomous fact extraction in the background
        extractor.extractAfterTurn(text, fullResponse);

      } catch (err) {
        console.error('\n❌ Oops, my brain had a hiccup:', err);
      }

      ask(); // Loop again
    });
  };

  ask(); // Start loop
}

main().catch(console.error);
