import { NextResponse } from 'next/server';
import { ed } from '../../../../lib/ed25519';
import { consumeNonce, getBuilderPublicKey } from '../../../../server/db';
import { createSession, sessionCookie } from '../../../../server/session';
import { authMessage } from '../../../../lib/authMessage';

export const runtime = 'nodejs';

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function POST(request: Request) {
  const { builderId, nonce, signature } = await request
    .json()
    .catch(() => ({}));

  if (
    typeof builderId !== 'string' ||
    typeof nonce !== 'string' ||
    typeof signature !== 'string' ||
    !/^[0-9a-f]{128}$/.test(signature)
  ) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  if (!consumeNonce(nonce, builderId)) {
    return NextResponse.json({ error: 'nonce expired' }, { status: 401 });
  }

  const publicKey = getBuilderPublicKey(builderId);
  if (!publicKey) {
    return NextResponse.json({ error: 'unknown builder' }, { status: 401 });
  }

  const valid = ed.verify(
    fromHex(signature),
    new TextEncoder().encode(authMessage(nonce)),
    fromHex(publicKey),
  );
  if (!valid) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  const response = NextResponse.json({ builderId });
  response.cookies.set(
    sessionCookie.name,
    await createSession(builderId),
    sessionCookie.options,
  );
  return response;
}
