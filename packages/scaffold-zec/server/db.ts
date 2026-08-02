import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * SQLite is deliberate for now: single file, zero infrastructure, and the
 * query surface below is small enough that moving to Postgres later is a
 * driver swap rather than a rewrite. Requires the Node runtime — route
 * handlers that touch this must not run on edge.
 */

const DB_PATH = process.env.DATABASE_PATH ?? '.data/speedrun.db';

let db: Database.Database | null = null;

function connect(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const handle = new Database(DB_PATH);
  handle.pragma('journal_mode = WAL');
  handle.exec(`
    CREATE TABLE IF NOT EXISTS builders (
      id          TEXT PRIMARY KEY,
      public_key  TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nonces (
      nonce      TEXT PRIMARY KEY,
      builder_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completions (
      builder_id     TEXT NOT NULL,
      challenge_slug TEXT NOT NULL,
      step_id        TEXT NOT NULL,
      verification   TEXT NOT NULL,
      evidence       TEXT,
      created_at     INTEGER NOT NULL,
      PRIMARY KEY (builder_id, challenge_slug, step_id)
    );
  `);
  return handle;
}

function conn(): Database.Database {
  return (db ??= connect());
}

export interface Completion {
  challengeSlug: string;
  stepId: string;
  verification: 'attested' | 'chain';
  evidence: string | null;
  createdAt: number;
}

export function upsertBuilder(id: string, publicKey: string): void {
  conn()
    .prepare(
      `INSERT INTO builders (id, public_key, created_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
    )
    .run(id, publicKey, Date.now());
}

export function getBuilderPublicKey(id: string): string | null {
  const row = conn()
    .prepare('SELECT public_key FROM builders WHERE id = ?')
    .get(id) as { public_key: string } | undefined;
  return row?.public_key ?? null;
}

export function issueNonce(builderId: string, ttlMs: number): string {
  const nonce = crypto.randomUUID();
  conn()
    .prepare('INSERT INTO nonces (nonce, builder_id, expires_at) VALUES (?, ?, ?)')
    .run(nonce, builderId, Date.now() + ttlMs);
  return nonce;
}

/** Single-use: a nonce is consumed whether or not the signature checks out. */
export function consumeNonce(nonce: string, builderId: string): boolean {
  const row = conn()
    .prepare('SELECT builder_id, expires_at FROM nonces WHERE nonce = ?')
    .get(nonce) as { builder_id: string; expires_at: number } | undefined;
  conn().prepare('DELETE FROM nonces WHERE nonce = ?').run(nonce);
  return (
    !!row && row.builder_id === builderId && row.expires_at > Date.now()
  );
}

export function recordCompletion(
  builderId: string,
  c: Omit<Completion, 'createdAt'>,
): void {
  conn()
    .prepare(
      `INSERT INTO completions
         (builder_id, challenge_slug, step_id, verification, evidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(builder_id, challenge_slug, step_id) DO UPDATE SET
         verification = excluded.verification,
         evidence     = excluded.evidence`,
    )
    .run(
      builderId,
      c.challengeSlug,
      c.stepId,
      c.verification,
      c.evidence,
      Date.now(),
    );
}

export function listCompletions(builderId: string): Completion[] {
  return conn()
    .prepare(
      `SELECT challenge_slug, step_id, verification, evidence, created_at
       FROM completions WHERE builder_id = ? ORDER BY created_at`,
    )
    .all(builderId)
    .map((r) => {
      const row = r as {
        challenge_slug: string;
        step_id: string;
        verification: 'attested' | 'chain';
        evidence: string | null;
        created_at: number;
      };
      return {
        challengeSlug: row.challenge_slug,
        stepId: row.step_id,
        verification: row.verification,
        evidence: row.evidence,
        createdAt: row.created_at,
      };
    });
}
