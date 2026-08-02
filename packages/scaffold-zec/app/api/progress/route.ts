import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listCompletions, recordCompletion } from '../../../server/db';
import { readSession, sessionCookie } from '../../../server/session';
import { verifyStep } from '../../../server/verification';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const store = await cookies();
  const builderId = await readSession(store.get(sessionCookie.name)?.value);
  if (!builderId) {
    return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  }

  const { challengeSlug, stepId, evidence } = await request
    .json()
    .catch(() => ({}));
  if (typeof challengeSlug !== 'string' || typeof stepId !== 'string') {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const result = await verifyStep(challengeSlug, stepId, evidence);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }

  recordCompletion(builderId, {
    challengeSlug,
    stepId,
    verification: result.verification,
    evidence: result.evidence,
  });

  return NextResponse.json({ completions: listCompletions(builderId) });
}
