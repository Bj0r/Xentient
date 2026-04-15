import { MemoryDB, Episode } from './MemoryDB';
import { MemoryContext, LLMProvider, Message } from '../providers/types';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({ name: 'memory-injector' });

export class MemoryInjector {
  private db: MemoryDB;
  private llm: LLMProvider;
  private contextDir: string;

  constructor(db: MemoryDB, llm: LLMProvider, contextDir?: string) {
    this.db = db;
    this.llm = llm;
    this.contextDir = contextDir ?? path.join(process.cwd(), 'context');
  }

  /**
   * Build a memory-augmented context for the LLM.
   *
   * This is the "thinking step" — we don't blindly inject all memories.
   * Instead:
   * 1. Extract keywords from the user message
   * 2. FTS5 search for relevant episodes
   * 3. LLM reviews candidates and picks the top relevant ones
   * 4. Inject filtered context into MemoryContext
   */
  async buildContext(userMessage: string): Promise<MemoryContext> {
    // Tier 1: Always-loaded user profile from markdown files
    const userProfile = this.loadTier1Context();

    // Tier 2a: Extract keywords and search episodes
    const keywords = this.extractKeywords(userMessage);
    logger.debug({ keywords }, 'Extracted keywords for memory search');

    let relevantEpisodes = '';
    if (keywords.length > 0) {
      const candidateEpisodes = this.db.searchEpisodes(keywords, 8);

      if (candidateEpisodes.length > 0) {
        // THE THINKING STEP: LLM selects relevant memories
        relevantEpisodes = await this.thinkingStep(userMessage, candidateEpisodes);
      }
    }

    // Fallback: recent episodes if no keyword match
    if (!relevantEpisodes) {
      const recent = this.db.getRecentEpisodes(4);
      if (recent.length > 0) {
        relevantEpisodes = this.formatEpisodes(recent);
      }
    }

    // Tier 2b: All known facts about the user
    const facts = this.db.getAllFacts();
    const extractedFacts = facts.length > 0
      ? facts.map(f => `- ${f.category}/${f.key}: ${f.value}`).join('\n')
      : '';

    logger.debug({
      hasProfile: !!userProfile,
      episodeCount: relevantEpisodes.split('\n').length,
      factCount: facts.length,
    }, 'Memory context built');

    return { userProfile, relevantEpisodes, extractedFacts };
  }

  /**
   * The Thinking Step — LLM reviews candidate memories and picks relevant ones.
   * This prevents noisy/irrelevant context from polluting the main LLM call.
   */
  private async thinkingStep(userMessage: string, candidates: Episode[]): Promise<string> {
    const candidateText = this.formatEpisodes(candidates);

    const thinkingPrompt: Message[] = [
      {
        role: 'user',
        content: `Current user message: "${userMessage}"

Retrieved memory candidates (may or may not be relevant):
${candidateText}

Which of these past conversations are actually relevant to what the user just said?
Return ONLY the relevant ones verbatim, or return "NONE" if none are relevant.
Be selective — only return memories that would genuinely help you respond better.`,
      },
    ];

    const emptyContext: MemoryContext = { userProfile: '', relevantEpisodes: '', extractedFacts: '' };

    let filteredMemory = '';
    try {
      for await (const token of this.llm.complete(thinkingPrompt, emptyContext, {
        temperature: 0.1,  // Low temperature for selection task
        maxTokens: 300,
      })) {
        filteredMemory += token;
      }
    } catch (err) {
      logger.error({ err }, 'Thinking step failed — using unfiltered memories');
      return candidateText;  // Fallback to unfiltered
    }

    return filteredMemory.trim() === 'NONE' ? '' : filteredMemory.trim();
  }

  private loadTier1Context(): string {
    const parts: string[] = [];

    const userMdPath = path.join(this.contextDir, 'USER.md');
    const memMdPath = path.join(this.contextDir, 'MEMORY.md');

    if (existsSync(userMdPath)) {
      parts.push(readFileSync(userMdPath, 'utf-8'));
    }
    if (existsSync(memMdPath)) {
      parts.push(readFileSync(memMdPath, 'utf-8'));
    }

    return parts.join('\n\n') || 'No user profile loaded.';
  }

  /**
   * Simple keyword extraction — production version would use LLM.
   * For V1: extract nouns and meaningful words (>3 chars, not stop words).
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'what', 'when', 'where', 'who', 'why', 'how', 'this', 'that', 'with',
      'from', 'have', 'been', 'will', 'your', 'just', 'like', 'into', 'some',
      'than', 'then', 'them', 'they', 'also', 'more', 'other', 'would', 'about',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
      .slice(0, 10); // Max 10 keywords
  }

  private formatEpisodes(episodes: Episode[]): string {
    return episodes
      .map(e => `[${e.createdAt}] ${e.role === 'user' ? 'User' : 'Xentient'}: ${e.content}`)
      .join('\n');
  }
}