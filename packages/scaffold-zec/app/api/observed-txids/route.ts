import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recordObservedTxids } from '../../../server/db';
import { readSession, sessionCookie } from '../../../server/session';

export const runtime = 'nodejs';

const MAX_BATCH = 50;

/**
 * The run panel reports txids the connected wallet enumerated, ahead of any
 * submission. Chain verification on embedded-wallet challenges then only
 * accepts txids seen here — see hasObservedTxid in server/db.ts for what
 * this does and does not prove.
 */
export async function POST(request: Request) {
  const store = await cookies();
  const builderId = await readSession(store.get(sessionCookie.name)?.value);
  if (!builderId) {
    return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  }

  const { txids } = await request.json().catch(() => ({}));
  if (
    !Array.isArray(txids) ||
    txids.length > MAX_BATCH ||
    !txids.every((t) => typeof t === 'string' && /^[0-9a-f]{64}$/i.test(t))
  ) {
    return NextResponse.json({ error: 'invalid txids' }, { status: 400 });
  }

  await recordObservedTxids(
    builderId,
    txids.map((t: string) => t.toLowerCase()),
  );
  return NextResponse.json({ ok: true });
}
