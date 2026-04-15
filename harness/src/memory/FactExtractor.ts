import { LLMProvider, MemoryContext, Message } from '../providers/types';
import { MemoryDB } from './MemoryDB';
import pino from 'pino';

const logger = pino({ name: 'fact-extractor' });

// [REVIEW FIX: MEDIUM] Guard against API hammering from rapid/noisy turns
const MIN_WORD_COUNT = 5;         // Skip extraction if turn < N words (config: factExtractMinWords)
const DEBOUNCE_MS = 10_000;       // Batch extractions every 10s (config: factExtractDebounceMs)

interface ExtractedFact {
  category: string;
  key: string;
  value: string;
  confidence: number;
}

interface PendingTurn {
  userMessage: string;
  assistantResponse: string;
}

export class FactExtractor {
  private llm: LLMProvider;
  private db: MemoryDB;
  private pendingTurns: PendingTurn[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private minWordCount: number;
  private debounceMs: number;

  constructor(llm: LLMProvider, db: MemoryDB, opts: { minWordCount?: number; debounceMs?: number } = {}) {
    this.llm = llm;
    this.db = db;
    this.minWordCount = opts.minWordCount ?? MIN_WORD_COUNT;
    this.debounceMs = opts.debounceMs ?? DEBOUNCE_MS;
  }

  /**
   * Queue a conversation turn for fact extraction.
   * Calls are debounced — batches up within DEBOUNCE_MS window.
   * Does NOT block the response pipeline (fire-and-forget).
   */
  extractAfterTurn(userMessage: string, assistantResponse: string): void {
    // [REVIEW FIX: MEDIUM] Skip short/noisy turns — not worth an LLM call
    const wordCount = userMessage.split(/\s+/).filter(Boolean).length;
    if (wordCount < this.minWordCount) {
      logger.debug({ wordCount, minWordCount: this.minWordCount }, 'Turn too short for fact extraction — skipping');
      return;
    }

    this.pendingTurns.push({ userMessage, assistantResponse });

    // Debounce: reset timer on every new turn to batch multiple rapid turns
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.flushPendingTurns().catch(err => {
        logger.debug({ err }, 'Fact extraction flush error (non-fatal)');
      });
    }, this.debounceMs);
  }

  /** Flush all queued turns in a single batched LLM call */
  private async flushPendingTurns(): Promise<void> {
    if (this.pendingTurns.length === 0) return;
    const turns = [...this.pendingTurns];
    this.pendingTurns = [];
    this.debounceTimer = null;

    logger.debug({ turnCount: turns.length }, 'Flushing fact extraction batch');

    const turnText = turns
      .map((t, i) => `Turn ${i + 1}:\n  User: "${t.userMessage}"\n  Xentient: "${t.assistantResponse}"`)
      .join('\n\n');

    const systemPrompt: Message[] = [
      {
        role: 'user',
        content: `From these conversation turns, extract durable facts about the user.

${turnText}

Extract facts in this JSON format (return empty array [] if no facts):
[
  {"category": "identity", "key": "name", "value": "David", "confidence": 0.95},
  {"category": "preference", "key": "language", "value": "English", "confidence": 0.9},
  {"category": "routine", "key": "morning_habit", "value": "checks weather", "confidence": 0.7}
]

Categories: identity, preference, routine, work, interest, location
Only high-confidence (>= 0.7), durable facts. NOT transient requests.`,
      },
    ];

    const emptyContext: MemoryContext = { userProfile: '', relevantEpisodes: '', extractedFacts: '' };

    let rawJson = '';
    try {
      for await (const token of this.llm.complete(systemPrompt, emptyContext, {
        temperature: 0.1,
        maxTokens: 300,
      })) {
        rawJson += token;
      }

      const jsonMatch = rawJson.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return;

      const facts: ExtractedFact[] = JSON.parse(jsonMatch[0]);

      for (const fact of facts) {
        if (fact.confidence >= 0.7) {
          this.db.saveFact(fact.category, fact.key, fact.value, fact.confidence);
        }
      }

      if (facts.length > 0) {
        logger.info({ factCount: facts.length, turnCount: turns.length }, 'Facts extracted and saved');
      }
    } catch (err) {
      logger.debug({ err }, 'Fact extraction skipped (expected for non-informative turns)');
    }
  }

  /** Flush remaining pending turns on graceful shutdown */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await this.flushPendingTurns();
  }
}