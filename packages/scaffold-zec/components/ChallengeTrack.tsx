import { LEVELS, challenges } from '../lib/challenges';
import { ChallengeRow } from './ChallengeRow';

/**
 * The full curriculum, grouped by level so the climb from first transaction
 * to intermediate developer reads as one path rather than a flat list.
 */
export function ChallengeTrack() {
  return (
    <div className="flex flex-col gap-10">
      {LEVELS.map((level) => {
        const rows = challenges.filter((c) => c.level === level.id);
        if (rows.length === 0) return null;
        return (
          <div key={level.id} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>
                {level.label}
              </span>
              <p className="m-0 text-[13.5px] leading-[1.6] muted">
                {level.outcome}
              </p>
            </div>
            <div className="flex flex-col">
              {rows.map((challenge, i) => (
                <div key={challenge.slug}>
                  {i > 0 && <div className="row-divider" />}
                  <ChallengeRow challenge={challenge} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
