#!/usr/bin/env node
/**
 * Syncs the challenge wallet and records incoming memo proofs in the app DB.
 *
 * The challenge wallet is a zcash-devtool light wallet whose address learners
 * pay with a `srz1:<builderId>` memo to prove authorship of a transaction.
 * This script runs devtool `sync` then `enhance` (memos only exist in full
 * transaction data, not compact blocks), then reads received outputs straight
 * from the wallet's zcash_client_sqlite database via the v_tx_outputs view —
 * a documented interface, unlike the CLI's human-oriented output.
 *
 * Run it on a timer (cron/launchd) or manually. Requires:
 *   CHALLENGE_WALLET_DIR  wallet directory (default ~/.speedrun-zcash/challenge-wallet)
 *   DEVTOOL_BIN           path to the zcash-devtool binary
 *   DATABASE_PATH         app DB (default .data/speedrun.db, same as server/db.ts)
 *
 * Against production the proofs go over HTTP instead — the wallet box holds
 * no Cloudflare credentials, and the authed route can only insert memo rows:
 *   MEMO_PROOFS_URL       e.g. https://speedrun-zcash.example.workers.dev/api/memo-proofs
 *   MEMO_INGEST_TOKEN     bearer secret matching the Worker's MEMO_INGEST_TOKEN
 */
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const walletDir =
  process.env.CHALLENGE_WALLET_DIR ??
  join(homedir(), '.speedrun-zcash', 'challenge-wallet');
const devtool = process.env.DEVTOOL_BIN;
const appDbPath = process.env.DATABASE_PATH ?? '.data/speedrun.db';

const MEMO_PREFIX = 'srz1:';

if (!devtool || !existsSync(devtool)) {
  console.error('DEVTOOL_BIN is not set or does not exist');
  process.exit(1);
}
if (!existsSync(join(walletDir, 'data.sqlite'))) {
  console.error(`no wallet database in ${walletDir}`);
  process.exit(1);
}

function run(args) {
  execFileSync(devtool, args, { stdio: ['ignore', 'inherit', 'inherit'] });
}

run(['wallet', '-w', walletDir, 'sync', '-s', 'zecrocks']);
// Compact blocks carry only note ciphertext fragments; enhance fetches the
// full transactions so the 512-byte memos become readable.
run(['wallet', '-w', walletDir, 'enhance', '-s', 'zecrocks']);

const wallet = new DatabaseSync(join(walletDir, 'data.sqlite'), {
  readOnly: true,
});
const rows = wallet
  .prepare(
    `SELECT txid, tx_mined_height, value, memo
     FROM v_tx_outputs
     WHERE to_account_uuid IS NOT NULL AND is_change = 0 AND memo IS NOT NULL`,
  )
  .all();
wallet.close();

// txids are stored in consensus byte order; the familiar hex form is reversed.
function displayTxid(bytes) {
  return Buffer.from(bytes).reverse().toString('hex');
}

// Memos are 512 bytes, zero-padded. A leading byte of 0xf6 marks an
// intentionally empty memo; anything else that decodes as UTF-8 is text.
function decodeMemo(bytes) {
  const buf = Buffer.from(bytes);
  if (buf.length === 0 || buf[0] === 0xf6) return null;
  let end = buf.length;
  while (end > 0 && buf[end - 1] === 0) end--;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf.subarray(0, end));
  } catch {
    return null;
  }
}

const proofs = [];
for (const row of rows) {
  const memo = decodeMemo(row.memo);
  if (memo === null) continue;
  proofs.push({
    txid: displayTxid(row.txid),
    builderId: memo.startsWith(MEMO_PREFIX)
      ? memo.slice(MEMO_PREFIX.length).trim()
      : null,
    memo,
    minedHeight: row.tx_mined_height ?? null,
    value: row.value,
  });
}

const remoteUrl = process.env.MEMO_PROOFS_URL;
if (remoteUrl) {
  const token = process.env.MEMO_INGEST_TOKEN;
  if (!token) {
    console.error('MEMO_PROOFS_URL is set but MEMO_INGEST_TOKEN is not');
    process.exit(1);
  }
  const res = await fetch(remoteUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ proofs }),
  });
  if (!res.ok) {
    console.error(`ingest endpoint replied ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const reply = await res.json();
  console.log(
    `recorded ${reply.recorded} memo output(s) remotely from ${rows.length} candidate row(s)`,
  );
  process.exit(0);
}

const app = new DatabaseSync(appDbPath);
// The app may be serving requests while this runs; without a timeout a
// write collision surfaces as an immediate SQLITE_BUSY throw.
app.exec('PRAGMA busy_timeout = 5000');
// Standalone runs (fresh box, cron before first request) must not depend on
// the app having connected once; same schema as server/db.ts.
app.exec(
  `CREATE TABLE IF NOT EXISTS memo_proofs (
     txid         TEXT PRIMARY KEY,
     builder_id   TEXT,
     memo         TEXT NOT NULL,
     mined_height INTEGER,
     value        INTEGER NOT NULL,
     seen_at      INTEGER NOT NULL
   )`,
);
const upsert = app.prepare(
  `INSERT INTO memo_proofs (txid, builder_id, memo, mined_height, value, seen_at)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(txid) DO UPDATE SET
     builder_id   = excluded.builder_id,
     memo         = excluded.memo,
     mined_height = excluded.mined_height`,
);

for (const p of proofs) {
  upsert.run(p.txid, p.builderId, p.memo, p.minedHeight, p.value, Date.now());
}
app.close();

console.log(
  `recorded ${proofs.length} memo output(s) locally from ${rows.length} candidate row(s)`,
);
