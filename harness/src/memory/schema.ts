import Database from 'better-sqlite3';
import path from 'path';
import pino from 'pino';
import fs from 'fs';

const logger = pino({ name: 'memory-schema' });

export function initDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? path.join(process.cwd(), 'data', 'xentient_memory.db');

  // Ensure data directory exists
  const dir = path.dirname(resolvedPath);
  fs.mkdirSync(dir, { recursive: true });

  const db = new Database(resolvedPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  logger.info({ dbPath: resolvedPath }, 'Database initialized');

  // Tier 2a: Episodic memory — conversation turns (FTS5 for full-text search)
  db.exec(`
    CREATE TABLE IF NOT EXISTS episode_messages (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      role      TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content   TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- FTS5 virtual table linked to episode_messages (external content)
    CREATE VIRTUAL TABLE IF NOT EXISTS episodes USING fts5(
      content,
      role UNINDEXED,
      session_id UNINDEXED,
      created_at UNINDEXED,
      content='episode_messages',
      content_rowid='id'
    );

    -- Triggers to keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS episodes_ai AFTER INSERT ON episode_messages BEGIN
      INSERT INTO episodes(rowid, content, role, session_id, created_at)
      VALUES (new.id, new.content, new.role, new.session_id, new.created_at);
    END;

    CREATE TRIGGER IF NOT EXISTS episodes_ad AFTER DELETE ON episode_messages BEGIN
      INSERT INTO episodes(episodes, rowid, content, role, session_id, created_at)
      VALUES ('delete', old.id, old.content, old.role, old.session_id, old.created_at);
    END;
  `);

  // Tier 2b: Semantic memory — extracted facts about users
  db.exec(`
    CREATE TABLE IF NOT EXISTS facts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT NOT NULL, -- 'name', 'preference', 'routine', 'work', 'interest'
      key         TEXT NOT NULL,
      value       TEXT NOT NULL,
      confidence  REAL NOT NULL DEFAULT 0.8,
      source      TEXT,          -- episode_id that surfaced this fact
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(category, key)
    );
  `);

  // Tier 2c: Sessions tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at   TEXT,
      turn_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  logger.info('Schema ready: episodes (FTS5), facts, sessions');
  return db;
}