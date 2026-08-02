'use client';

import Link from 'next/link';
import { Alert, Card, Spinner } from '@heroui/react';
import { useWebZjs } from '../../lib/WebZjsProvider';
import { WalletBoot } from '../../components/WalletBoot';
import { CreateWallet } from '../../components/CreateWallet';
import { ShieldedBalance } from '../../components/ShieldedBalance';
import { AddressDisplay } from '../../components/AddressDisplay';
import { SendZec } from '../../components/SendZec';
import { SyncStatus } from '../../components/SyncStatus';
import { Notice } from '../../components/Notice';
import { describeWalletError } from '../../lib/walletError';

function Dashboard() {
  const { status, error } = useWebZjs();

  if (status === 'idle' || status === 'initializing') {
    return (
      <Card>
        <Card.Content className="flex items-center gap-3">
          <Spinner size="sm" aria-label="Starting the light client" />
          <span className="muted text-sm">
            Starting the light client. The proving parameters are a large
            download the first time.
          </span>
        </Card.Content>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <Card.Header>
          <Card.Title className="panel-title">Wallet failed to start</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          {(() => {
            const problem = describeWalletError(error);
            return (
              <Alert
                status={problem.kind === 'connection' ? 'warning' : 'danger'}
              >
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{problem.title}</Alert.Title>
                  <Alert.Description>{problem.message}</Alert.Description>
                </Alert.Content>
              </Alert>
            );
          })()}
        </Card.Content>
      </Card>
    );
  }

  if (status === 'no-account') return <CreateWallet />;

  return (
    <>
      <SyncStatus />
      <div className="grid gap-4 sm:grid-cols-2">
        <ShieldedBalance />
        <AddressDisplay />
      </div>
      <SendZec />
    </>
  );
}

export default function WalletPage() {
  return (
    <main className="wrap section flex flex-col gap-6">
      <WalletBoot />
      <div className="flex flex-col gap-3">
        <span className="eyebrow">Scaffold-ZEC · testnet</span>
        <h1 className="display text-[40px]">Wallet</h1>
        <p className="lede">
          A shielded wallet running entirely in this tab. Keys never leave your
          machine. New here? Start with{' '}
          {/* NextLink keeps client-side routing; the `link` BEM class is the
              HeroUI-documented way to style framework links. */}
          <Link
            href="/challenges"
            className="link"
            style={{ color: 'var(--accent)' }}
          >
            the challenges
          </Link>
          .
        </p>
      </div>

      <Notice
        id="proving-time"
        action={{ label: 'faucet ↗', href: 'https://faucet.zecpages.com/' }}
      >
        Testnet only, so these coins are worthless. Zero-knowledge proofs are
        built in this tab, so a send takes around 30 seconds.
      </Notice>

      <Dashboard />
    </main>
  );
}
