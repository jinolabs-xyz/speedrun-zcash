'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alert, Chip, Surface } from '@heroui/react';
import { getChallenge } from '../../../lib/challenges';
import { WalletBoot } from '../../../components/WalletBoot';
import { Notice } from '../../../components/Notice';
import { Challenge0Play } from '../../../components/challenge/Challenge0Play';
import { ChallengeRun } from '../../../components/challenge/ChallengeRun';

export default function ChallengePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const challenge = getChallenge(slug);
  // Lessons are published as they're written; only true stubs 404.
  if (!challenge || (challenge.status !== 'live' && challenge.lesson.length === 0))
    notFound();
  const live = challenge.status === 'live';

  return (
    <main className="wrap section flex max-w-[760px] flex-col gap-10">
      <WalletBoot />

      <header className="flex flex-col gap-4">
        <Link href="/challenges" className="eyebrow hover:text-[var(--gold)]">
          ← All challenges
        </Link>
        <div className="flex items-baseline gap-4">
          <span
            className="display text-[44px] leading-none"
            style={{ color: 'var(--gold)' }}
          >
            #{challenge.number}
          </span>
          <h1 className="display text-[32px]">{challenge.title}</h1>
        </div>
        <p className="lede">{challenge.tagline}</p>
        <div className="flex flex-wrap gap-2">
          {challenge.skills.map((skill) => (
            <Chip key={skill} size="sm" variant="soft" className="mono">
              {skill}
            </Chip>
          ))}
        </div>
      </header>

      <Notice
        id="proving-time"
        action={{ label: 'faucet ↗', href: 'https://faucet.zecpages.com/' }}
      >
        Testnet only, so these coins are worthless. Zero-knowledge proofs are
        built in this tab, so a send takes around 30 seconds.
      </Notice>

      <Surface
        variant="transparent"
        className="flex flex-col gap-2 rounded-2xl p-6"
        style={{ border: '1px solid var(--hairline)' }}
      >
        <span className="eyebrow">
          Codebase you’ll meet · {challenge.codebase.name}
        </span>
        <p className="m-0 text-[14.5px] leading-[1.7] muted">
          {challenge.codebase.whatItDoes}
        </p>
        <a
          href={challenge.codebase.repo}
          target="_blank"
          rel="noreferrer"
          className="link mono self-start text-[12.5px]"
          style={{ color: 'var(--accent)' }}
        >
          {challenge.codebase.repo.replace('https://', '')} ↗
        </a>
      </Surface>

      {challenge.lesson.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="card-title">{section.heading}</h2>
          {section.body.map((paragraph, i) => (
            <p key={i} className="m-0 text-[15px] leading-[1.7] muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {live &&
        (challenge.slug === 'first-shielded-transaction' ? (
          <Challenge0Play challenge={challenge} />
        ) : (
          <ChallengeRun challenge={challenge} />
        ))}

      {!live && challenge.steps.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="card-title">What you’ll do</h2>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {challenge.steps.map((step, i) => (
              <li key={step.id} className="flex gap-4">
                <span
                  className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px]"
                  style={{ border: '1px solid var(--edge)', color: 'var(--dim)' }}
                >
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15.5px] font-semibold">
                      {step.title}
                    </span>
                    {step.verification === 'chain' && (
                      <Chip size="sm" variant="soft" className="mono">
                        chain-verified
                      </Chip>
                    )}
                  </div>
                  <p className="m-0 text-[14px] leading-[1.6] muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                The interactive run panel for this challenge is being built.
                These steps will check themselves here, the way challenge #0’s
                do. The lesson above is ready now.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </section>
      )}

      {challenge.gotcha && (
        <Surface
          variant="transparent"
          className="flex flex-col gap-3 rounded-2xl p-6"
          style={{
            border: '1px solid rgba(244,183,40,.25)',
            background: 'var(--gold-wash)',
          }}
        >
          <h2 className="card-title" style={{ color: 'var(--gold)' }}>
            {challenge.gotcha.heading}
          </h2>
          {challenge.gotcha.body.map((paragraph, i) => (
            <p key={i} className="m-0 text-[15px] leading-[1.7] muted">
              {paragraph}
            </p>
          ))}
        </Surface>
      )}
    </main>
  );
}
