'use client';

import { useState } from 'react';
import { Alert, Button, Card, Input, ProgressBar, Spinner } from '@heroui/react';
import { useWebZjs } from '../lib/WebZjsProvider';
import { zecToZats } from '../lib/zec';
import { describeWalletError } from '../lib/walletError';

export function SendZec({ onSent }: { onSent?: () => void }) {
  const { send, sending, balance } = useWebZjs();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const spendable = (balance?.sapling ?? 0) + (balance?.orchard ?? 0);

  const onSend = async () => {
    setError(null);
    setResult(null);
    try {
      await send(to.trim(), zecToZats(amount));
      setResult(`Sent ${amount} TAZ. It will confirm on the next block.`);
      setTo('');
      setAmount('');
      onSent?.();
    } catch (e) {
      setError(e);
    }
  };

  const problem = error ? describeWalletError(error) : null;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="eyebrow">Send shielded</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <Input
          aria-label="Recipient address"
          placeholder="Recipient, utest1… or tm…"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mono"
        />
        <Input
          aria-label="Amount in TAZ"
          placeholder="Amount in TAZ"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="mono"
        />

        <div className="flex flex-wrap items-center gap-3">
          {/* isPending rather than isDisabled: it marks the button busy for
              assistive tech and blocks presses, instead of looking merely
              unavailable through a thirty-second wait. */}
          <Button
            variant="primary"
            onPress={onSend}
            isPending={sending}
            isDisabled={!to.trim() || !amount || spendable === 0}
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? 'Building proof…' : 'Send'}
              </>
            )}
          </Button>
          {!sending && spendable === 0 && (
            <span className="hint">Nothing spendable yet.</span>
          )}
        </div>

        {/* Proving gives no progress signal to report, so the bar is
            indeterminate — it exists to show the tab is still working
            through a wait that otherwise looks like a hang. */}
        {sending && (
          <div className="flex flex-col gap-2">
            <ProgressBar
              isIndeterminate
              aria-label="Building zero-knowledge proof"
              size="sm"
              color="accent"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <span className="hint">
              Building the proof in this tab, around thirty seconds. Leave the
              page open.
            </span>
          </div>
        )}

        {result && (
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{result}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
        {problem && (
          <Alert status={problem.kind === 'connection' ? 'warning' : 'danger'}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{problem.title}</Alert.Title>
              <Alert.Description>{problem.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Card.Content>
    </Card>
  );
}
