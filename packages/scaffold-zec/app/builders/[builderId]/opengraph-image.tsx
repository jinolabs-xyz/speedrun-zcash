import { ImageResponse } from 'next/og';
import { challenges } from '../../../lib/challenges';
import { getPublicProfile } from '../../../server/db';

export const runtime = 'nodejs';
export const alt = 'Speedrun Zcash builder progress';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Shared cards are worth a moment of cache; progress changes at human pace.
export const revalidate = 300;

export default async function Image({
  params,
}: {
  params: { builderId: string };
}) {
  const profile = /^[0-9a-f]{32}$/.test(params.builderId)
    ? await getPublicProfile(params.builderId)
    : null;

  const cleared = profile
    ? challenges.filter(
        (challenge) =>
          challenge.steps.length > 0 &&
          challenge.steps.every((step) =>
            profile.completions.some(
              (c) => c.challengeSlug === challenge.slug && c.stepId === step.id,
            ),
          ),
      ).length
    : 0;

  const shortId = profile
    ? `${profile.builderId.slice(0, 8)}…${profile.builderId.slice(-4)}`
    : 'unknown builder';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0b0b0d',
          color: '#f5f5f4',
          padding: 72,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 26, color: '#8a8a85', letterSpacing: 4 }}>
            SPEEDRUN ZCASH
          </div>
          <div style={{ fontSize: 64, color: '#e8b923' }}>{shortId}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <div style={{ fontSize: 128, lineHeight: 1 }}>{cleared}</div>
          <div style={{ fontSize: 40, color: '#8a8a85' }}>
            of {challenges.length} challenges cleared
          </div>
        </div>

        <div style={{ fontSize: 28, color: '#8a8a85' }}>
          Learning Zcash by shipping on it
        </div>
      </div>
    ),
    size,
  );
}
