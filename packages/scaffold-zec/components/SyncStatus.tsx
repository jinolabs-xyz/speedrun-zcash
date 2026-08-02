'use client';

import { Button, ProgressBar, Surface } from '@heroui/react';
import { useWebZjs } from '../lib/WebZjsProvider';

export function SyncStatus() {
  const {
    syncing,
    chainHeight,
    fullyScannedHeight,
    birthday,
    triggerSync,
    network,
  } = useWebZjs();

  const scanned = fullyScannedHeight === null ? null : Number(fullyScannedHeight);
  const tip = chainHeight === null ? null : Number(chainHeight);
  const synced = tip !== null && scanned !== null && tip - scanned <= 1;

  // Scanning runs from the wallet's birthday to the tip; measuring from zero
  // would peg every wallet at ~99.99% and tell the user nothing. The wallet
  // can report a scanned height below its own birthday, which would put the
  // value under minValue and clamp the bar to empty — so take whichever is
  // lower as the floor.
  const floor =
    scanned === null ? null : Math.min(birthday ?? scanned, scanned);
  const canMeasure =
    scanned !== null && tip !== null && floor !== null && tip > floor;
  const behind = scanned !== null && tip !== null ? tip - scanned : 0;

  return (
    <Surface
      variant="transparent"
      className="flex flex-col gap-2 rounded-xl px-4 py-3"
      style={{ border: '1px solid var(--hairline)' }}
    >
      <div className="flex items-center gap-[10px]">
        <span
          className={`dot ${syncing ? 'dot-busy' : synced ? 'dot-live' : 'dot-idle'}`}
        />
        <span className="mono text-[12px]" style={{ color: 'var(--dim)' }}>
          {network === 'test' ? 'testnet' : 'mainnet'} ·{' '}
          {syncing
            ? 'scanning…'
            : synced
              ? 'up to date'
              : scanned !== null
                ? `${behind.toLocaleString()} blocks behind`
                : 'not synced'}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onPress={triggerSync}
          isPending={syncing}
        >
          Sync
        </Button>
      </div>

      {!synced && canMeasure && (
        <ProgressBar
          aria-label="Blocks scanned"
          size="sm"
          color="accent"
          minValue={floor}
          maxValue={tip}
          value={scanned}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      )}
    </Surface>
  );
}
