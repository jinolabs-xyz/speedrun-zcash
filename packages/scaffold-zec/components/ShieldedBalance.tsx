'use client';

import { Card } from '@heroui/react';
import { useWebZjs } from '../lib/WebZjsProvider';
import { zatsToZec } from '../lib/zec';

export function ShieldedBalance() {
  const { balance } = useWebZjs();
  const shielded = (balance?.sapling ?? 0) + (balance?.orchard ?? 0);
  const pending =
    (balance?.pendingChange ?? 0) + (balance?.pendingSpendable ?? 0);

  const rows: [string, number, boolean][] = [
    ['Orchard', balance?.orchard ?? 0, false],
    ['Sapling', balance?.sapling ?? 0, false],
    ['Transparent', balance?.transparent ?? 0, true],
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title className="eyebrow">Shielded balance</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div
          className="mono text-[32px] leading-none"
          style={{ color: 'var(--accent)' }}
        >
          {zatsToZec(shielded)}
          <span className="ml-2 text-[13px]" style={{ color: 'var(--dim)' }}>
            TAZ
          </span>
        </div>

        <div className="flex flex-col gap-[6px] text-[13px]">
          {rows.map(([label, value, exposed]) => (
            <div key={label} className="flex justify-between">
              <span style={{ color: exposed ? 'var(--danger)' : 'var(--dim)' }}>
                {label}
                {exposed && ' · public'}
              </span>
              <span className="mono">{zatsToZec(value)}</span>
            </div>
          ))}
          {pending > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--dim)' }}>Pending</span>
              <span className="mono">{zatsToZec(pending)}</span>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
