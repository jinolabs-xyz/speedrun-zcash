import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { challenges } from '../../../lib/challenges';
import { getPublicProfile } from '../../../server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A builder's public portfolio. Builders are pseudonymous by construction —
 * the ID is derived from a browser-local secret and has no link to a wallet
 * — which is what makes a public page safe to share here.
 *
 * Deliberately absent: evidence txids. A page that pairs a stable pseudonym
 * with the transactions that pseudonym made would hand an observer exactly
 * the correlation the shielded pool exists to prevent, and learners posting
 * their progress cannot be expected to reason about that. Verification keeps
 * the txids server-side where they are needed.
 */

const ID_PATTERN = /^[0-9a-f]{32}$/;

function shortId(builderId: string): string {
  return `${builderId.slice(0, 8)}…${builderId.slice(-4)}`;
}

/** A challenge counts as done when every one of its steps is accepted. */
function completedChallenges(
  completions: { challengeSlug: string; stepId: string }[],
): typeof challenges {
  return challenges.filter((challenge) => {
    if (challenge.steps.length === 0) return false;
    return challenge.steps.every((step) =>
      completions.some(
        (c) => c.challengeSlug === challenge.slug && c.stepId === step.id,
      ),
    );
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ builderId: string }>;
}): Promise<Metadata> {
  const { builderId } = await params;
  if (!ID_PATTERN.test(builderId)) return { title: 'Builder not found' };

  const profile = await getPublicProfile(builderId);
  if (!profile) return { title: 'Builder not found' };

  const cleared = completedChallenges(profile.completions).length;
  const title = `Builder ${shortId(builderId)} · Speedrun Zcash`;
  const description = `${cleared} of ${challenges.length} challenges cleared, building on Zcash.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/builders/${builderId}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/builders/${builderId}/opengraph-image`],
    },
  };
}

export default async function BuilderProfile({
  params,
}: {
  params: Promise<{ builderId: string }>;
}) {
  const { builderId } = await params;
  if (!ID_PATTERN.test(builderId)) notFound();

  const profile = await getPublicProfile(builderId);
  if (!profile) notFound();

  const cleared = completedChallenges(profile.completions);
  const clearedSlugs = new Set(cleared.map((c) => c.slug));
  const joined = new Date(profile.joinedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="wrap section flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">builder</span>
        <h1 className="mono m-0 text-[28px] leading-tight">
          {shortId(builderId)}
        </h1>
        <p className="hint m-0">
          Building since {joined}. {cleared.length} of {challenges.length}{' '}
          challenges cleared.
        </p>
      </header>

      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {challenges.map((challenge) => {
          const done = clearedSlugs.has(challenge.slug);
          return (
            <li
              key={challenge.slug}
              className="flex items-baseline gap-3 rounded-xl px-4 py-3"
              style={{
                border: '1px solid var(--hairline)',
                opacity: done ? 1 : 0.45,
              }}
            >
              <span className="mono text-[12px]" style={{ color: 'var(--dim)' }}>
                {String(challenge.number).padStart(2, '0')}
              </span>
              <span className="text-[15px]">{challenge.title}</span>
              {done && (
                <span
                  className="mono ml-auto text-[12px]"
                  style={{ color: 'var(--success)' }}
                >
                  cleared
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="hint m-0">
        Pseudonymous by design. This page shows which challenges were cleared,
        never the transactions that cleared them.{' '}
        <Link href="/challenges" style={{ color: 'var(--accent)' }}>
          Start your own run
        </Link>
        .
      </p>
    </main>
  );
}
