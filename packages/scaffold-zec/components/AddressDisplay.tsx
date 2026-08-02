'use client';

import { useState } from 'react';
import { Button, Card, Link } from '@heroui/react';
import { useWebZjs } from '../lib/WebZjsProvider';
import { shortenAddress } from '../lib/zec';

function CopyRow({
  label,
  value,
  exposed = false,
}: {
  label: string;
  value: string | null;
  exposed?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  return (
    <div className="flex flex-col gap-[6px]">
      <span
        className="eyebrow"
        style={exposed ? { color: 'var(--danger)' } : undefined}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 truncate text-[12.5px]" title={value}>
          {shortenAddress(value, 12)}
        </code>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onPress={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

export function AddressDisplay() {
  const { unifiedAddress, transparentAddress } = useWebZjs();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="eyebrow">Receive</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <CopyRow label="Unified · shielded" value={unifiedAddress} />
        <CopyRow
          label="Transparent · visible"
          value={transparentAddress}
          exposed
        />
        <p className="hint m-0">
          Fund it from the{' '}
          <Link
            href="https://faucet.zecpages.com/"
            target="_blank"
            rel="noreferrer"
            className="text-[length:inherit]"
            style={{ color: 'var(--accent)' }}
          >
            testnet faucet
          </Link>
          . Anything the transparent address touches is public forever.
        </p>
      </Card.Content>
    </Card>
  );
}
