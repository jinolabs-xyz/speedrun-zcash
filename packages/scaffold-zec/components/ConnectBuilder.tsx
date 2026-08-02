'use client';

import { Alert, Button, Spinner, Surface } from '@heroui/react';
import { useBuilder } from '../lib/BuilderProvider';
import { describeWalletError } from '../lib/walletError';

export function ConnectBuilder() {
  const { builderId, connect, connecting, error, canConnect } = useBuilder();
  const problem = error ? describeWalletError(error) : null;

  if (builderId) {
    return (
      <Surface
        variant="transparent"
        className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
        style={{ border: '1px solid var(--hairline)' }}
      >
        <span className="dot dot-live" />
        <span className="text-[13px] muted">
          Builder{' '}
          <code style={{ color: 'var(--accent)' }}>{builderId.slice(0, 8)}</code>
          , and your run follows this seed to any browser.
        </span>
      </Surface>
    );
  }

  return (
    <Surface
      variant="transparent"
      className="flex flex-col gap-3 rounded-xl p-5"
      style={{
        border: '1px solid var(--gold-edge)',
        background: 'var(--gold-wash)',
      }}
    >
      <span className="eyebrow" style={{ color: 'var(--accent)' }}>
        Track your run
      </span>
      <p className="m-0 text-[14.5px] leading-[1.6] muted">
        Your builder identity is derived from your wallet seed, with no account
        and no password. Only a pseudonym and a public key are sent, never the
        seed and nothing that links to your addresses.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="primary"
          onPress={connect}
          isPending={connecting}
          isDisabled={!canConnect}
        >
          {({ isPending }) => (
            <>
              {isPending && <Spinner color="current" size="sm" />}
              {isPending ? 'Connecting…' : 'Connect wallet'}
            </>
          )}
        </Button>
        {!canConnect && (
          <span className="hint">Create a wallet below first.</span>
        )}
      </div>
      {problem && (
        <Alert status={problem.kind === 'connection' ? 'warning' : 'danger'}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{problem.title}</Alert.Title>
            <Alert.Description>{problem.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </Surface>
  );
}
