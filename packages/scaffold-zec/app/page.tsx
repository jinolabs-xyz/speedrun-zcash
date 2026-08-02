import Link from 'next/link';
import { LEVELS, challenges } from '../lib/challenges';
import { ChallengeTrack } from '../components/ChallengeTrack';
import { CursorTrail } from '../components/CursorTrail';
import { ArrowLink } from '../components/ArrowLink';
import { Notice } from '../components/Notice';
import { Faqs } from '../components/Faqs';
import { WarpBackground } from '../components/WarpBackground';

const STEPS = [
  {
    label: '01 · READ',
    title: 'A short lesson',
    body: 'Two minutes, starting from zero. The first ones explain like you’re five, with no jargon before its time.',
  },
  {
    label: '02 · BUILD',
    title: 'Do the real thing',
    body: 'A live shielded wallet is embedded in every challenge. Real keys, real proofs, real testnet blocks.',
  },
  {
    label: '03 · CLEAR',
    title: 'Steps check themselves',
    body: 'The run panel watches wallet state and ticks steps off as you go. No self-reporting.',
  },
];

export default function Home() {
  const first = challenges.find((c) => c.status === 'live');

  return (
    <main>
      <div className="relative isolate overflow-hidden">
        {/* Fills the whole hero viewport, behind the framed headline. */}
        <WarpBackground className="-z-10" />

        <section className="wrap relative flex min-h-[100svh] flex-col items-center justify-center gap-9 py-28 text-center">
          <div className="hero-frame rise" style={{ animationDelay: '90ms' }}>
            {/* Background layer — sits inside the border and behind the
                headline. Point .hero-frame__bg at an image to replace the
                gradient. */}
            <div className="hero-frame__bg" aria-hidden="true" />
            {/* Scoped to the block: the canvas covers only the frame, and
                the ribbon draws only while the pointer is over it. */}
            <CursorTrail />

            <span className="hero-bracket hero-bracket--tl" aria-hidden="true" />
            <span className="hero-bracket hero-bracket--tr" aria-hidden="true" />
            <span className="hero-bracket hero-bracket--bl" aria-hidden="true" />
            <span className="hero-bracket hero-bracket--br" aria-hidden="true" />

            <h1 className="hero-title-center">
              Go from zero to Zcash{' '}
              <span className="unredact">contributor</span>.
            </h1>
          </div>

          <p
            className="lede rise mx-auto"
            style={{ animationDelay: '210ms' }}
          >
            No crypto background needed. Learn by doing, on a real wallet.
          </p>

          <div
            className="rise flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '300ms' }}
          >
            {/* These navigate, so they stay anchors and borrow HeroUI's button
                styling through its BEM classes rather than becoming buttons. */}
            {first && (
              <ArrowLink href={`/challenges/${first.slug}`}>
                Start Challenge
              </ArrowLink>
            )}
            <Link
              href="/challenges"
              className="button button--ghost button--lg"
            >
              See the 10 challenges
            </Link>
          </div>
        </section>
      </div>

      <div className="wrap">
        <div className="rule" />
      </div>

      <section className="wrap section grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {STEPS.map((step) => (
          <div key={step.label} className="flex flex-col gap-3">
            <span className="mono text-[12px]" style={{ color: 'var(--gold)' }}>
              {step.label}
            </span>
            <span className="card-title">{step.title}</span>
            <p className="m-0 text-[14.5px] leading-[1.6] muted">{step.body}</p>
          </div>
        ))}
      </section>

      <div className="wrap">
        <div className="rule" />
      </div>

      <section className="wrap section flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">The path</span>
          <h2 className="display text-[28px]">
            Arrive knowing nothing. Leave a Zcash contributor.
          </h2>
          <p className="lede">
            One track, four levels, ten challenges, taken slowly. Each one
            assumes only the one before it. Every challenge introduces a real
            codebase (WebZjs, librustzcash, Zebra, Zaino, orchard), so by the
            end you know what each library does and have used them all.
          </p>
        </div>
        <div className="grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {LEVELS.map((level, i) => (
            <div key={level.id} className="flex flex-col gap-3">
              <span
                className="mono text-[12px]"
                style={{ color: 'var(--gold)' }}
              >
                {String(i + 1).padStart(2, '0')} · {level.label.toUpperCase()}
              </span>
              <p className="m-0 text-[14.5px] leading-[1.6] muted">
                {level.outcome}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="wrap">
        <div className="rule" />
      </div>

      <section id="challenges" className="wrap section flex flex-col gap-7">
        <Notice
          id="open-source"
          action={{
            label: 'github ↗',
            href: 'https://github.com/Giri-Aayush/speedrun-zcash',
          }}
        >
          Free and open source under MIT. That covers the challenges, the
          wallet, and the platform running them. No accounts, no paid tier,
          nothing to unlock.
        </Notice>

        <div className="flex items-baseline gap-4">
          <h2 className="display text-[28px]">The curriculum</h2>
          <span className="mono ml-auto text-[12px]" style={{ color: 'var(--dim)' }}>
            {challenges.filter((c) => c.status === 'live').length}/
            {challenges.length} live
          </span>
        </div>

        <ChallengeTrack />
      </section>

      <div className="wrap">
        <div className="rule" />
      </div>

      <section className="wrap section flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">After the capstone</span>
          <h2 className="display text-[28px]">Where this leads</h2>
          <p className="lede">
            Speedrun Zcash is the gym, not the library. Finish the track and
            the ecosystem is ready for you, with codebases, collaborators, and
            funding all waiting.
          </p>
        </div>
        <div className="grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {[
            {
              title: 'Get your work funded',
              body: 'Zcash Community Grants funds builders shipping on the protocol. Capstone projects are exactly what it exists for.',
              label: 'zcashcommunitygrants.org ↗',
              href: 'https://zcashcommunitygrants.org',
            },
            {
              title: 'Build with the core teams',
              body: 'librustzcash, Zebra, Zaino, WebZjs. The codebases this track trains you for are developed in the open, and the capstone lands your first PR in one.',
              label: 'github.com/zcash ↗',
              href: 'https://github.com/zcash',
            },
            {
              title: 'Join the conversation',
              body: 'The community forum is where protocol changes, grants, and new projects get discussed, and where builders find collaborators.',
              label: 'forum.zcashcommunity.com ↗',
              href: 'https://forum.zcashcommunity.com',
            },
            {
              title: 'Prefer reading? ZecHub',
              body: 'We teach by doing. ZecHub is the community’s encyclopedia, with guides, a wiki, and ecosystem news. Read there, train here. They compound.',
              label: 'zechub.wiki ↗',
              href: 'https://zechub.wiki',
            },
          ].map((item) => (
            <div key={item.href} className="flex flex-col gap-3">
              <span className="card-title">{item.title}</span>
              <p className="m-0 text-[14.5px] leading-[1.6] muted">
                {item.body}
              </p>
              {/* Server component, so the HeroUI Link styles come via its
                  documented BEM class rather than the client-only import. */}
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="link mono self-start text-[12.5px]"
                style={{ color: 'var(--accent)' }}
              >
                {item.label}
              </a>
            </div>
          ))}
        </div>
      </section>

      <div className="wrap">
        <div className="rule" />
      </div>

      <Faqs />
    </main>
  );
}
