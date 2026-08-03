'use client';

import { useState } from 'react';
import { Alert, Button, Card, Chip, Input, ProgressBar } from '@heroui/react';
import type { Challenge } from '../../lib/challenges';
import { CHALLENGE_MEMO_ADDRESS } from '../../lib/challenges';
import { useWebZjs } from '../../lib/WebZjsProvider';
import { useBuilder } from '../../lib/BuilderProvider';
import { ConnectBuilder } from '../ConnectBuilder';
import { CommandBlock } from '../CommandBlock';
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

const DONE_LABEL = {
  attested: 'self-attested',
  chain: 'verified on-chain',
  memo: 'memo-verified',
} as const;

/**
 * The run panel for every challenge. The builder drives:
 *
 * - attested steps have a "Mark complete" button — the server records the
 *   builder's signed word, labelled as exactly that.
 * - chain steps submit a txid the server independently looks up on
 *   lightwalletd. With the embedded wallet present the panel finds a mined
 *   outgoing transaction itself; on CLI challenges (embeddedWallet: false)
 *   the builder pastes the txid from their own terminal.
 * - memo steps always take a pasted txid, and show the challenge address
 *   plus the exact `srz1:<builderId>` memo the builder must send, because
 *   the proof is the memo, not the txid.
 */
export function ChallengeRun({ challenge }: { challenge: Challenge }) {
  const cli = challenge.embeddedWallet === false;
  const { status, listTransactions } = useWebZjs();
  const { builderId, submitStep, isComplete, completions } = useBuilder();
  const [pending, setPending] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [txids, setTxids] = useState<Record<string, string>>({});

  const done = (stepId: string) => isComplete(challenge.slug, stepId);
  // The stored verdict for a step that failed verification — rejection
  // feedback is part of the record now, not a toast that dies with the tab.
  const rejectedRecord = (stepId: string) =>
    completions.find(
      (c) =>
        c.challengeSlug === challenge.slug &&
        c.stepId === stepId &&
        c.status === 'rejected',
    );
  const completed = challenge.steps.filter((s) => done(s.id)).length;
  const allDone =
    challenge.steps.length > 0 && completed === challenge.steps.length;

  const submit = async (stepId: string, evidence?: { txid?: string }) => {
    setPending(stepId);
    setRejection(null);
    try {
      const result = await submitStep(challenge.slug, stepId, evidence);
      if (!result.ok && !result.stored) {
        setRejection(result.reason ?? 'not confirmed');
      }
    } finally {
      setPending(null);
    }
  };

  const verifyTxid = async (stepId: string) => {
    const pasted = txids[stepId]?.trim();
    if (pasted) {
      await submit(stepId, { txid: pasted });
      return;
    }
    if (cli) {
      setRejection('paste the transaction id from your terminal first.');
      return;
    }
    // Embedded-wallet challenges can find the evidence themselves.
    setPending(stepId);
    setRejection(null);
    try {
      const transactions = await listTransactions();
      // Tell the server what the wallet has actually seen before verifying —
      // chain steps on wallet challenges only accept observed txids (#6).
      const minedTxids = transactions
        .filter((tx) => tx.blockHeight !== null)
        .map((tx) => tx.txid);
      if (minedTxids.length > 0) {
        await fetch('/api/observed-txids', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ txids: minedTxids.slice(0, 50) }),
        }).catch(() => {});
      }
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
      if (!result.ok && !result.stored) {
        setRejection(result.reason ?? 'not confirmed');
      }
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
                      {DONE_LABEL[step.verification]}
                    </Chip>
                  )}
                  {!done(step.id) && rejectedRecord(step.id) && (
                    <Chip size="sm" variant="soft" color="danger" className="mono">
                      rejected
                    </Chip>
                  )}
                </div>
                {!done(step.id) && rejectedRecord(step.id)?.feedback && (
                  <p className="m-0 text-[13px] leading-[1.5]" style={{ color: 'var(--danger)' }}>
                    {rejectedRecord(step.id)!.feedback}
                  </p>
                )}
                <p className="m-0 text-[14px] leading-[1.6] muted">
                  {step.detail}
                </p>
                {!done(step.id) && step.verification === 'memo' && (
                  builderId ? (
                    <CommandBlock
                      cmd={`$DT wallet -w ~/zec-wallet send -i ~/zec-wallet/identity.txt --address ${CHALLENGE_MEMO_ADDRESS} --value 1000000 --memo "srz1:${builderId}"`}
                      expect="Your exact command, memo included. Copy, run, wait a block, paste the txid it prints."
                    />
                  ) : (
                    <div className="flex flex-col gap-1 rounded-lg p-3" style={{ border: '1px solid var(--hairline)' }}>
                      <span className="eyebrow">send to</span>
                      <code className="mono break-all text-[11.5px]">
                        {CHALLENGE_MEMO_ADDRESS}
                      </code>
                      <span className="hint mt-1">
                        Connect your run above and this becomes a copyable send command with your memo filled in.
                      </span>
                    </div>
                  )
                )}
                {!done(step.id) && (
                  <div className="flex flex-wrap items-center gap-3">
                    {step.verification !== 'attested' && (cli || step.verification === 'memo') && (
                      <Input
                        aria-label="transaction id"
                        placeholder="paste the txid"
                        className="mono min-w-[220px] flex-1"
                        value={txids[step.id] ?? ''}
                        onChange={(e) =>
                          setTxids((prev) => ({
                            ...prev,
                            [step.id]: e.target.value,
                          }))
                        }
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      isPending={pending === step.id}
                      isDisabled={!builderId}
                      onPress={() =>
                        step.verification === 'attested'
                          ? submit(step.id)
                          : verifyTxid(step.id)
                      }
                    >
                      {step.verification === 'attested'
                        ? 'Mark complete'
                        : step.verification === 'memo'
                          ? 'Verify memo'
                          : 'Verify on chain'}
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

        {!cli && (
          <>
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
                The embedded wallet boots when this page opens, and
                chain-verified steps use it as their evidence.
              </p>
            )}
          </>
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
