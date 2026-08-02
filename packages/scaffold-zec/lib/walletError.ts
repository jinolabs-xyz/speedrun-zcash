/**
 * Turns the raw errors WebZjs throws into something a learner can act on.
 * A dead lightwalletd proxy surfaces as "GRPC ... Failed to fetch", which
 * tells a first-timer nothing. We detect the connection case and explain
 * it, and pass anything genuinely unexpected through untouched so real
 * bugs still show.
 */

const PROXY =
  process.env.NEXT_PUBLIC_LIGHTWALLETD_PROXY || 'http://localhost:8080';

export type WalletError = {
  kind: 'connection' | 'other';
  title: string;
  message: string;
};

export function describeWalletError(err: unknown): WalletError {
  const raw = err instanceof Error ? err.message : String(err);

  const looksLikeNetwork =
    /failed to fetch|networkerror|load failed|grpc|unknown error|connection|econnrefused|fetch/i.test(
      raw,
    );

  if (!looksLikeNetwork) {
    return { kind: 'other', title: 'Something went wrong', message: raw };
  }

  const local =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  if (local) {
    return {
      kind: 'connection',
      title: 'Cannot reach the Zcash testnet',
      message:
        `The wallet talks to a local proxy at ${PROXY} and nothing answered. ` +
        'Open a terminal in the project and run ./infra/run-testnet-proxy.sh, ' +
        'leave it running, then try again.',
    };
  }

  return {
    kind: 'connection',
    title: 'Cannot reach the Zcash testnet',
    message:
      'The testnet node is not responding right now. This is usually brief, ' +
      'so wait a few seconds and try again.',
  };
}
