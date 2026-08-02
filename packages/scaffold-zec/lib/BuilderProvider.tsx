'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useWebZjs } from './WebZjsProvider';
import { deriveIdentity } from './identity';
import { authMessage } from './authMessage';
import { mnemonicToSeed } from './bip39';

/**
 * Builder identity and cross-device progress.
 *
 * Connecting is an explicit action, never automatic: it is the moment a
 * builder chooses to be tracked, and it sends a derived pseudonym and a
 * public key — never the seed, and never anything that links to their
 * addresses or balances.
 */

export interface Completion {
  challengeSlug: string;
  stepId: string;
  verification: 'attested' | 'chain';
  evidence: string | null;
  createdAt: number;
}

export interface BuilderApi {
  builderId: string | null;
  completions: Completion[];
  connecting: boolean;
  error: string | null;
  /** True once a wallet exists, so an identity can be derived. */
  canConnect: boolean;
  connect: () => Promise<void>;
  submitStep: (
    challengeSlug: string,
    stepId: string,
    evidence?: { txid?: string },
  ) => Promise<{ ok: boolean; reason?: string }>;
  isComplete: (challengeSlug: string, stepId: string) => boolean;
}

const Ctx = createContext<BuilderApi | null>(null);

export function useBuilder(): BuilderApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuilder must be used inside <BuilderProvider>');
  return ctx;
}

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const { seedPhrase } = useWebZjs();
  const [builderId, setBuilderId] = useState<string | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore an existing session on load.
  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.builderId) {
          setBuilderId(data.builderId);
          setCompletions(data.completions ?? []);
        }
      })
      .catch(() => {
        /* offline or API down — the wallet still works standalone */
      });
  }, []);

  const connect = useCallback(async () => {
    if (!seedPhrase) return;
    setConnecting(true);
    setError(null);
    try {
      const seed = await mnemonicToSeed(seedPhrase);
      const identity = deriveIdentity(seed);

      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          builderId: identity.builderId,
          publicKey: identity.publicKey,
        }),
      });
      if (!nonceResponse.ok) {
        throw new Error((await nonceResponse.json()).error ?? 'nonce refused');
      }
      const { nonce } = await nonceResponse.json();

      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          builderId: identity.builderId,
          nonce,
          signature: identity.sign(authMessage(nonce)),
        }),
      });
      if (!verifyResponse.ok) {
        throw new Error((await verifyResponse.json()).error ?? 'sign-in failed');
      }

      setBuilderId(identity.builderId);
      const me = await fetch('/api/me').then((r) => r.json());
      setCompletions(me.completions ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConnecting(false);
    }
  }, [seedPhrase]);

  const submitStep = useCallback(
    async (
      challengeSlug: string,
      stepId: string,
      evidence?: { txid?: string },
    ) => {
      if (!builderId) return { ok: false, reason: 'not connected' };
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeSlug, stepId, evidence }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, reason: data.error ?? 'rejected' };
      setCompletions(data.completions ?? []);
      return { ok: true };
    },
    [builderId],
  );

  const isComplete = useCallback(
    (challengeSlug: string, stepId: string) =>
      completions.some(
        (c) => c.challengeSlug === challengeSlug && c.stepId === stepId,
      ),
    [completions],
  );

  return (
    <Ctx.Provider
      value={{
        builderId,
        completions,
        connecting,
        error,
        canConnect: !!seedPhrase,
        connect,
        submitStep,
        isComplete,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
