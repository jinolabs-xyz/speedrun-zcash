import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * D1 (Cloudflare's SQLite) replaced the better-sqlite3 file when the app
 * moved onto Workers — same schema, same queries, but every call is now
 * async because D1 only speaks promises. Local dev gets a local D1 instance
 * automatically: initOpenNextCloudflareForDev() in next.config.mjs wires the
 * bindings from wrangler.jsonc into `next dev`, persisted under .wrangler/.
 */

// Minimal structural types for the D1 surface we use. Pulling in the full
// generated Workers runtime types would collide with the DOM lib that the
// rest of the app compiles against.
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

// CREATE IF NOT EXISTS on first touch, like the old connect() did — no
// migration step to forget. One batch per isolate; the promise is cached so
// concurrent requests don't race it.
let schemaReady: Promise<unknown> | null = null;

function conn(): D1Database {
  const { env } = getCloudflareContext();
  const db = (env as { DB?: D1Database }).DB;
  if (!db) {
    throw new Error(
      'D1 binding "DB" is missing — check d1_databases in wrangler.jsonc',
    );
  }
  return db;
}

async function ready(): Promise<D1Database> {
  const db = conn();
  schemaReady ??= db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS builders (
        id          TEXT PRIMARY KEY,
        public_key  TEXT NOT NULL,
        created_at  INTEGER NOT NULL
      )`),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS nonces (
        nonce      TEXT PRIMARY KEY,
        builder_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )`),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS completions (
        builder_id     TEXT NOT NULL,
        challenge_slug TEXT NOT NULL,
        step_id        TEXT NOT NULL,
        verification   TEXT NOT NULL,
        evidence       TEXT,
        status         TEXT NOT NULL DEFAULT 'accepted',
        feedback       TEXT,
        created_at     INTEGER NOT NULL,
        PRIMARY KEY (builder_id, challenge_slug, step_id)
      )`),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS observed_txids (
        builder_id TEXT NOT NULL,
        txid       TEXT NOT NULL,
        first_seen INTEGER NOT NULL,
        PRIMARY KEY (builder_id, txid)
      )`),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS memo_proofs (
        txid         TEXT PRIMARY KEY,
        builder_id   TEXT,
        memo         TEXT NOT NULL,
        mined_height INTEGER,
        value        INTEGER NOT NULL,
        seen_at      INTEGER NOT NULL
      )`),
  ]);
  await schemaReady;
  return db;
}

// Existing deployments created `completions` before the lifecycle columns.
// ADD COLUMN is the only migration; a duplicate-column error means it
// already ran, which is the steady state.
let lifecycleReady: Promise<void> | null = null;

async function migrated(): Promise<D1Database> {
  const db = await ready();
  lifecycleReady ??= (async () => {
    for (const column of [
      "ALTER TABLE completions ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'",
      'ALTER TABLE completions ADD COLUMN feedback TEXT',
    ]) {
      try {
        await db.prepare(column).run();
      } catch {
        /* duplicate column — already migrated */
      }
    }
  })();
  await lifecycleReady;
  return db;
}

export interface Completion {
  challengeSlug: string;
  stepId: string;
  verification: 'attested' | 'chain' | 'memo';
  evidence: string | null;
  /** Lifecycle verdict. Rejections carry feedback — the teaching moment. */
  status: 'accepted' | 'rejected';
  feedback: string | null;
  createdAt: number;
}

export interface MemoProof {
  txid: string;
  builderId: string | null;
  memo: string;
  minedHeight: number | null;
  value: number;
}

/**
 * Written by the memo ingest after syncing the challenge wallet (in
 * production via the authed /api/memo-proofs route, since the ingest box
 * has no D1 binding). builder_id is pre-parsed from the memo at ingest
 * time so verification is a single indexed lookup; the raw memo is kept
 * for auditing mismatches.
 */
export async function upsertMemoProof(p: MemoProof): Promise<void> {
  const db = await ready();
  await db
    .prepare(
      `INSERT INTO memo_proofs (txid, builder_id, memo, mined_height, value, seen_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(txid) DO UPDATE SET
         builder_id   = excluded.builder_id,
         memo         = excluded.memo,
         mined_height = excluded.mined_height`,
    )
    .bind(p.txid, p.builderId, p.memo, p.minedHeight, p.value, Date.now())
    .run();
}

export async function getMemoProof(txid: string): Promise<MemoProof | null> {
  const db = await ready();
  const row = await db
    .prepare(
      `SELECT txid, builder_id, memo, mined_height, value
       FROM memo_proofs WHERE txid = ?`,
    )
    .bind(txid)
    .first<{
      txid: string;
      builder_id: string | null;
      memo: string;
      mined_height: number | null;
      value: number;
    }>();
  if (!row) return null;
  return {
    txid: row.txid,
    builderId: row.builder_id,
    memo: row.memo,
    minedHeight: row.mined_height,
    value: row.value,
  };
}

export async function upsertBuilder(id: string, publicKey: string): Promise<void> {
  const db = await ready();
  await db
    .prepare(
      `INSERT INTO builders (id, public_key, created_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(id, publicKey, Date.now())
    .run();
}

export async function getBuilderPublicKey(id: string): Promise<string | null> {
  const db = await ready();
  const row = await db
    .prepare('SELECT public_key FROM builders WHERE id = ?')
    .bind(id)
    .first<{ public_key: string }>();
  return row?.public_key ?? null;
}

export async function issueNonce(builderId: string, ttlMs: number): Promise<string> {
  const db = await ready();
  const nonce = crypto.randomUUID();
  await db
    .prepare('INSERT INTO nonces (nonce, builder_id, expires_at) VALUES (?, ?, ?)')
    .bind(nonce, builderId, Date.now() + ttlMs)
    .run();
  return nonce;
}

/** Single-use: a nonce is consumed whether or not the signature checks out.
 *  DELETE ... RETURNING makes the read-and-burn a single atomic statement. */
export async function consumeNonce(nonce: string, builderId: string): Promise<boolean> {
  const db = await ready();
  const row = await db
    .prepare('DELETE FROM nonces WHERE nonce = ? RETURNING builder_id, expires_at')
    .bind(nonce)
    .first<{ builder_id: string; expires_at: number }>();
  return (
    !!row && row.builder_id === builderId && row.expires_at > Date.now()
  );
}

export async function recordCompletion(
  builderId: string,
  c: Omit<Completion, 'createdAt'>,
): Promise<void> {
  const db = await migrated();
  // The WHERE clause is the no-downgrade rule: once a step is accepted, a
  // later failed attempt must not erase the success.
  await db
    .prepare(
      `INSERT INTO completions
         (builder_id, challenge_slug, step_id, verification, evidence, status, feedback, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(builder_id, challenge_slug, step_id) DO UPDATE SET
         verification = excluded.verification,
         evidence     = excluded.evidence,
         status       = excluded.status,
         feedback     = excluded.feedback
       WHERE NOT (completions.status = 'accepted' AND excluded.status = 'rejected')`,
    )
    .bind(
      builderId,
      c.challengeSlug,
      c.stepId,
      c.verification,
      c.evidence,
      c.status,
      c.feedback,
      Date.now(),
    )
    .run();
}

export async function listCompletions(builderId: string): Promise<Completion[]> {
  const db = await migrated();
  const { results } = await db
    .prepare(
      `SELECT challenge_slug, step_id, verification, evidence, status, feedback, created_at
       FROM completions WHERE builder_id = ? ORDER BY created_at`,
    )
    .bind(builderId)
    .all<{
      challenge_slug: string;
      step_id: string;
      verification: 'attested' | 'chain' | 'memo';
      evidence: string | null;
      status: 'accepted' | 'rejected';
      feedback: string | null;
      created_at: number;
    }>();
  return results.map((row) => ({
    challengeSlug: row.challenge_slug,
    stepId: row.step_id,
    verification: row.verification,
    evidence: row.evidence,
    status: row.status,
    feedback: row.feedback,
    createdAt: row.created_at,
  }));
}

/**
 * Which txids a builder's connected wallet has actually enumerated. Chain
 * verification on embedded-wallet challenges only accepts observed txids —
 * not cryptographic proof of authorship (that's the memo flow), but it
 * closes the paste-a-block-explorer-txid hole.
 */
export async function recordObservedTxids(
  builderId: string,
  txids: string[],
): Promise<void> {
  if (txids.length === 0) return;
  const db = await ready();
  const stmt = db.prepare(
    `INSERT INTO observed_txids (builder_id, txid, first_seen)
     VALUES (?, ?, ?) ON CONFLICT(builder_id, txid) DO NOTHING`,
  );
  const now = Date.now();
  await db.batch(txids.map((txid) => stmt.bind(builderId, txid, now)));
}

export async function hasObservedTxid(
  builderId: string,
  txid: string,
): Promise<boolean> {
  const db = await ready();
  const row = await db
    .prepare('SELECT 1 AS seen FROM observed_txids WHERE builder_id = ? AND txid = ?')
    .bind(builderId, txid)
    .first<{ seen: number }>();
  return row !== null;
}

export interface PublicProfile {
  builderId: string;
  joinedAt: number;
  /** Accepted steps only, and deliberately without evidence txids — see
   *  the profile route for why linking a pseudonym to on-chain activity
   *  would undo the point of the pseudonym. */
  completions: { challengeSlug: string; stepId: string; createdAt: number }[];
}

export async function getPublicProfile(
  builderId: string,
): Promise<PublicProfile | null> {
  const db = await migrated();
  const builder = await db
    .prepare('SELECT created_at FROM builders WHERE id = ?')
    .bind(builderId)
    .first<{ created_at: number }>();
  if (!builder) return null;

  const { results } = await db
    .prepare(
      `SELECT challenge_slug, step_id, created_at
       FROM completions
       WHERE builder_id = ? AND status = 'accepted'
       ORDER BY created_at`,
    )
    .bind(builderId)
    .all<{ challenge_slug: string; step_id: string; created_at: number }>();

  return {
    builderId,
    joinedAt: builder.created_at,
    completions: results.map((row) => ({
      challengeSlug: row.challenge_slug,
      stepId: row.step_id,
      createdAt: row.created_at,
    })),
  };
}
