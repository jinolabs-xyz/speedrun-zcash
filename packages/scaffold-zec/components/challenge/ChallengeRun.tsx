'use client';

import { useState } from 'react';
import { Alert, Button, Card, Chip, ProgressBar } from '@heroui/react';
import type { Challenge } from '../../lib/challenges';
import { useWebZjs } from '../../lib/WebZjsProvider';
import { useBuilder } from '../../lib/BuilderProvider';
import { ConnectBuilder } from '../ConnectBuilder';
import { CreateWallet } from '../CreateWallet';
import { AddressDisplay } from '../AddressDisplay';
import { ShieldedBalance } from '../ShieldedBalance';
import { SendZec } from '../SendZec';
import { SyncStatus } from '../SyncStatus';

function StepBadge({ done, index }: { done: boolean; index: number }) {
  return (
    <span
      className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px]"
      style={
        done
          ? { background: 'var(--gold)', color: 'var(--gold-ink)', fontWeight: 700 }
          : { border: '1px solid var(--edge)', color: 'var(--dim)' }
      }
    >
      {done ? '✓' : index + 1}
    </span>
  );
}

/**
 * Generic run panel for every challenge after #0. Challenge #0 keeps its
 * bespoke panel (Challenge0Play) because its steps advance automatically
 * from observed wallet state; here the builder drives instead:
 *
 * - attested steps have a "Mark complete" button — the server records the
 *   builder's signed word, labelled as exactly that.
 * - chain steps have a "Verify on chain" button — the panel finds a mined
 *   transaction in the wallet and submits its txid, which the server
 *   independently looks up on lightwalletd before accepting.
 */
export function ChallengeRun({ challenge }: { challenge: Challenge }) {
  const { status, listTransactions } = useWebZjs();
  const { builderId, submitStep, isComplete } = useBuilder();
  const [pending, setPending] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const done = (stepId: string) => isComplete(challenge.slug, stepId);
  const completed = challenge.steps.filter((s) => done(s.id)).length;
  const allDone =
    challenge.steps.length > 0 && completed === challenge.steps.length;

  const submit = async (stepId: string, evidence?: { txid?: string }) => {
    setPending(stepId);
    setRejection(null);
    try {
      const result = await submitStep(challenge.slug, stepId, evidence);
      if (!result.ok) setRejection(result.reason ?? 'not confirmed');
    } finally {
      setPending(null);
    }
  };

  const verifyOnChain = async (stepId: string) => {
    setPending(stepId);
    setRejection(null);
    try {
      const transactions = await listTransactions();
      const mined = transactions.find(
        (tx) => tx.direction === 'sent' && tx.blockHeight !== null,
      );
      if (!mined) {
        setRejection(
          'no mined outgoing transaction found yet. Send one from the wallet below and give it a block to confirm.',
        );
        return;
      }
      const result = await submitStep(challenge.slug, stepId, {
        txid: mined.txid,
      });
      if (!result.ok) setRejection(result.reason ?? 'not confirmed');
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <Card.Header className="flex items-baseline gap-4">
        <Card.Title className="panel-title">Your run</Card.Title>
        <span
          className="mono ml-auto text-[12px]"
          style={{ color: allDone ? 'var(--success)' : 'var(--dim)' }}
        >
          {completed}/{challenge.steps.length} cleared
        </span>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        <ProgressBar
          aria-label="Steps cleared"
          size="sm"
          color={allDone ? 'success' : 'accent'}
          maxValue={challenge.steps.length}
          value={completed}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        <ConnectBuilder />

        <ol className="m-0 flex list-none flex-col gap-5 p-0">
          {challenge.steps.map((step, i) => (
            <li key={step.id} className="flex gap-4">
              <StepBadge done={done(step.id)} index={i} />
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15.5px] font-semibold">
                    {step.title}
                  </span>
                  {done(step.id) && (
                    <Chip
                      size="sm"
                      variant="soft"
                      color="success"
                      className="mono"
                    >
                      {step.verification === 'chain'
                        ? 'verified on-chain'
                        : 'self-attested'}
                    </Chip>
                  )}
                </div>
                <p className="m-0 text-[14px] leading-[1.6] muted">
                  {step.detail}
                </p>
                {!done(step.id) && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      isPending={pending === step.id}
                      isDisabled={!builderId}
                      onPress={() =>
                        step.verification === 'chain'
                          ? verifyOnChain(step.id)
                          : submit(step.id)
                      }
                    >
                      {step.verification === 'chain'
                        ? 'Verify on chain'
                        : 'Mark complete'}
                    </Button>
                    {!builderId && (
                      <span className="hint">Connect your run above first.</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        {rejection && (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>Not confirmed yet: {rejection}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <div className="rule" />

        {status === 'no-account' ? (
          <CreateWallet />
        ) : status === 'ready' ? (
          <div className="flex flex-col gap-4">
            <SyncStatus />
            <div className="grid gap-4 sm:grid-cols-2">
              <ShieldedBalance />
              <AddressDisplay />
            </div>
            <SendZec />
          </div>
        ) : (
          <p className="hint m-0">
            The embedded wallet boots when this page opens, and chain-verified
            steps use it as their evidence.
          </p>
        )}

        {allDone && (
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                Challenge cleared. On to the next rung of the track.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Card.Content>
    </Card>
  );
}
