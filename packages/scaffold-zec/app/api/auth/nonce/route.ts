import { NextResponse } from 'next/server';
import { issueNonce, upsertBuilder, getBuilderPublicKey } from '../../../../server/db';

export const runtime = 'nodejs';

const NONCE_TTL_MS = 5 * 60 * 1000;
const HEX = /^[0-9a-f]+$/;

export async function POST(request: Request) {
  const { builderId, publicKey } = await request.json().catch(() => ({}));

  if (
    typeof builderId !== 'string' ||
    typeof publicKey !== 'string' ||
    builderId.length !== 32 ||
    publicKey.length !== 64 ||
    !HEX.test(builderId) ||
    !HEX.test(publicKey)
  ) {
    return NextResponse.json({ error: 'invalid identity' }, { status: 400 });
  }

  // First sight of a builder registers their key; later visits must match it,
  // otherwise anyone could claim an existing builder ID with their own key.
  const known = getBuilderPublicKey(builderId);
  if (known === null) {
    upsertBuilder(builderId, publicKey);
  } else if (known !== publicKey) {
    return NextResponse.json({ error: 'key mismatch' }, { status: 403 });
  }

  return NextResponse.json({ nonce: issueNonce(builderId, NONCE_TTL_MS) });
}
