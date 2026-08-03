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

  const result = await verifyStep(challengeSlug, stepId, evidence, builderId);

  if (!result.ok && result.kind === 'invalid') {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  if (!result.ok && result.kind === 'unavailable') {
    return NextResponse.json({ error: result.reason }, { status: 502 });
  }

  // Accepted and rejected are both verdicts worth keeping: the rejection
  // feedback is the teaching moment, and it survives a page reload. The
  // no-downgrade rule in recordCompletion protects accepted rows.
  const stepEvidence =
    typeof evidence?.txid === 'string' ? evidence.txid.toLowerCase() : null;
  await recordCompletion(
    builderId,
    result.ok
      ? {
          challengeSlug,
          stepId,
          verification: result.verification,
          evidence: result.evidence,
          status: 'accepted',
          feedback: null,
        }
      : {
          challengeSlug,
          stepId,
          verification: result.verification,
          evidence: stepEvidence,
          status: 'rejected',
          feedback: result.reason,
        },
  );

  return NextResponse.json({ completions: await listCompletions(builderId) });
}
