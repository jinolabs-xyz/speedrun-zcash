import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listCompletions } from '../../../server/db';
import { readSession, sessionCookie } from '../../../server/session';

export const runtime = 'nodejs';

export async function GET() {
  const store = await cookies();
  const builderId = await readSession(store.get(sessionCookie.name)?.value);

  if (!builderId) {
    return NextResponse.json({ builderId: null, completions: [] });
  }

  return NextResponse.json({
    builderId,
    completions: listCompletions(builderId),
  });
}
