import { NextResponse } from 'next/server';
import { upsertMemoProof } from '../../../server/db';

export const runtime = 'nodejs';

/**
 * Ingest endpoint for memo proofs, called by scripts/memo-ingest.mjs from
 * the box that runs the challenge wallet. That box deliberately holds no
 * Cloudflare credentials — a leaked MEMO_INGEST_TOKEN can only insert memo
 * proof rows, which verification treats as claims to check against a txid,
 * not as truth.
 */

const MAX_BATCH = 100;

async function tokenMatches(header: string | null): Promise<boolean> {
  const expected = process.env.MEMO_INGEST_TOKEN;
  if (!expected || !header?.startsWith('Bearer ')) return false;
  const given = header.slice('Bearer '.length);
  // Compare digests so the comparison cost doesn't depend on where the
  // strings first differ.
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

interface ProofInput {
  txid: string;
  builderId: string | null;
  memo: string;
  minedHeight: number | null;
  value: number;
}

function parseProof(raw: unknown): ProofInput | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.txid !== 'string' || !/^[0-9a-f]{64}$/.test(p.txid)) return null;
  if (typeof p.memo !== 'string' || p.memo.length > 512) return null;
  if (p.builderId !== null && typeof p.builderId !== 'string') return null;
  if (typeof p.builderId === 'string' && p.builderId.length > 128) return null;
  if (p.minedHeight !== null && !Number.isInteger(p.minedHeight)) return null;
  if (!Number.isInteger(p.value) || (p.value as number) < 0) return null;
  return {
    txid: p.txid,
    builderId: p.builderId as string | null,
    memo: p.memo,
    minedHeight: p.minedHeight as number | null,
    value: p.value as number,
  };
}

export async function POST(request: Request) {
  if (!(await tokenMatches(request.headers.get('authorization')))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const rawProofs = (body as { proofs?: unknown })?.proofs;
  if (!Array.isArray(rawProofs) || rawProofs.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `proofs must be an array of at most ${MAX_BATCH}` },
      { status: 400 },
    );
  }

  const proofs = rawProofs.map(parseProof);
  const bad = proofs.findIndex((p) => p === null);
  if (bad !== -1) {
    return NextResponse.json(
      { error: `invalid proof at index ${bad}` },
      { status: 400 },
    );
  }

  for (const proof of proofs as ProofInput[]) {
    await upsertMemoProof(proof);
  }
  return NextResponse.json({ ok: true, recorded: proofs.length });
}
