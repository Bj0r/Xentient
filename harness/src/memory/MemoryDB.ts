import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'memory-db' });

export interface Episode {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sessionId: string;
  createdAt: string;
}

export interface Fact {
  id: number;
  category: string;
  key: string;
  value: string;
  confidence: number;
  updatedAt: string;
}

export class MemoryDB {
  private db: Database.Database;
  private currentSessionId: string;

  // Prepared statement cache for performance
  private stmts: {
    insertEpisode: Database.Statement;
    searchEpisodes: Database.Statement;
    upsertFact: Database.Statement;
    getAllFacts: Database.Statement;
    getFact: Database.Statement;
    recentEpisodes: Database.Statement;
    startSession: Database.Statement;
    endSession: Database.Statement;
  };

  constructor(db: Database.Database) {
    this.db = db;
    this.currentSessionId = randomUUID();

    // Pre-compile statements for performance (better-sqlite3 sync API = <1ms per query)
    this.stmts = {
      insertEpisode: db.prepare(`
        INSERT INTO episode_messages (role, content, session_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `),
      searchEpisodes: db.prepare(`
        SELECT e.id, e.role, e.content, e.session_id, e.created_at
        FROM episode_messages e
        JOIN episodes ON episodes.rowid = e.id
        WHERE episodes MATCH ?
        ORDER BY episodes.rank
        LIMIT ?
      `),
      upsertFact: db.prepare(`
        INSERT INTO facts (category, key, value, confidence, source, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(category, key) DO UPDATE SET
          value = excluded.value,
          confidence = excluded.confidence,
          source = excluded.source,
          updated_at = datetime('now')
      `),
      getAllFacts: db.prepare(`SELECT * FROM facts ORDER BY category, key`),
      getFact: db.prepare(`SELECT * FROM facts WHERE category = ? AND key = ?`),
      recentEpisodes: db.prepare(`
        SELECT * FROM episode_messages
        ORDER BY created_at DESC
        LIMIT ?
      `),
      startSession: db.prepare(`
        INSERT INTO sessions (id) VALUES (?)
      `),
      endSession: db.prepare(`
        UPDATE sessions SET ended_at = datetime('now'), turn_count = ?
        WHERE id = ?
      `),
    };

    // Begin new session
    this.stmts.startSession.run(this.currentSessionId);
    logger.info({ sessionId: this.currentSessionId }, 'New memory session started');
  }

  /** Persist a conversation turn */
  saveTurn(role: 'user' | 'assistant', content: string): void {
    this.stmts.insertEpisode.run(role, content, this.currentSessionId);
  }

  /**
   * Search episodic memory by keyword using FTS5.
   * Keywords are LLM-extracted from user message — NOT raw user input.
   */
  searchEpisodes(keywords: string[], limit: number = 5): Episode[] {
    if (!keywords.length) return [];
    // Build FTS5 query: "keyword1 OR keyword2 OR keyword3"
    const ftsQuery = keywords
      .filter(k => k.length > 2) // Skip stop words
      .map(k => `"${k.replace(/"/g, '""')}"`)  // Escape quotes
      .join(' OR ');
    if (!ftsQuery) return [];

    try {
      return this.stmts.searchEpisodes.all(ftsQuery, limit) as Episode[];
    } catch (err) {
      logger.error({ err, ftsQuery }, 'FTS5 search error');
      return [];
    }
  }

  /** Get recent episodes (fallback when no keyword match) */
  getRecentEpisodes(limit: number = 6): Episode[] {
    return this.stmts.recentEpisodes.all(limit) as Episode[];
  }

  /** Upsert a fact about the user */
  saveFact(category: string, key: string, value: string, confidence: number = 0.8, source?: string): void {
    this.stmts.upsertFact.run(category, key, value, confidence, source ?? null);
    logger.info({ category, key, value }, 'Fact saved');
  }

  /** Get all known facts */
  getAllFacts(): Fact[] {
    return this.stmts.getAllFacts.all() as Fact[];
  }

  /** Get a specific fact */
  getFact(category: string, key: string): Fact | undefined {
    return this.stmts.getFact.get(category, key) as Fact | undefined;
  }

  /** Get user's name (convenience) */
  getUserName(): string | undefined {
    return this.getFact('identity', 'name')?.value;
  }

  endSession(turnCount: number): void {
    this.stmts.endSession.run(turnCount, this.currentSessionId);
    logger.info({ sessionId: this.currentSessionId, turnCount }, 'Session ended');
  }
}