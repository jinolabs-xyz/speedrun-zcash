'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { deriveIdentity } from './identity';
import { authMessage } from './authMessage';

/**
 * Builder identity and progress.
 *
 * Connecting is an explicit action, never automatic: it is the moment a
 * builder chooses to be tracked, and it sends a derived pseudonym and a
 * public key — never anything that links to their wallet, addresses or
 * balances.
 *
 * The identity secret is generated in this browser and stays in
 * localStorage. It is deliberately NOT derived from a wallet seed: since
 * Challenge #0 went CLI-first the learner's seed lives in their terminal
 * wallet, and a website asking for seed material teaches exactly the
 * habit this curriculum warns against. Proof that a builder controls a
 * wallet comes from memo verification instead. The cost is that progress
 * is per-browser until an export/restore path ships.
 */

export interface Completion {
  challengeSlug: string;
  stepId: string;
  verification: 'attested' | 'chain' | 'memo';
  evidence: string | null;
  createdAt: number;
}

const SECRET_KEY = 'srz-builder-secret-v1';

function localSecret(): Uint8Array {
  const stored = localStorage.getItem(SECRET_KEY);
  if (stored && /^[0-9a-f]{64}$/.test(stored)) {
    return Uint8Array.from(
      stored.match(/../g)!.map((byte) => parseInt(byte, 16)),
    );
  }
  const fresh = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(
    SECRET_KEY,
    Array.from(fresh, (b) => b.toString(16).padStart(2, '0')).join(''),
  );
  return fresh;
}

export interface BuilderApi {
  builderId: string | null;
  completions: Completion[];
  connecting: boolean;
  error: string | null;
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
    setConnecting(true);
    setError(null);
    try {
      const identity = deriveIdentity(localSecret());

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
  }, []);

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
        canConnect: true,
        connect,
        submitStep,
        isComplete,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
