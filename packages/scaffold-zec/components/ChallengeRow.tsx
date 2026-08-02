'use client';

import Link from 'next/link';
import { Chip } from '@heroui/react';
import type { Challenge } from '../lib/challenges';

export function ChallengeRow({
  challenge,
  cleared = false,
}: {
  challenge: Challenge;
  cleared?: boolean;
}) {
  const live = challenge.status === 'live';

  const body = (
    <>
      <span
        className="row-number"
        style={{ color: live ? 'var(--accent)' : 'var(--faint)' }}
      >
        #{challenge.number}
      </span>
      <div className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-[16.5px] font-semibold">{challenge.title}</span>
        <span className="text-[13.5px] muted">{challenge.tagline}</span>
      </div>
      <Chip
        size="sm"
        variant="soft"
        color={cleared ? 'success' : live ? 'accent' : 'default'}
        className="mono ml-auto"
      >
        {cleared ? 'CLEARED' : live ? 'LIVE' : 'SOON'}
      </Chip>
      {live && (
        <span className="text-[17px]" style={{ color: 'var(--accent)' }}>
          →
        </span>
      )}
    </>
  );

  // Lessons are readable before the interactive run panel ships, so any
  // challenge with written content links through; only true stubs stay flat.
  const readable = live || challenge.lesson.length > 0;

  if (!readable) return <div className="row row-soon">{body}</div>;

  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className={live ? 'row row-live' : 'row row-soon'}
    >
      {body}
    </Link>
  );
}
