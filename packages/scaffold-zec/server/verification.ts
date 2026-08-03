import { getChallenge } from '../lib/challenges';
import { lookupTransaction } from './lightwalletd';
import { getMemoProof } from './db';

export type VerificationResult =
  | { ok: true; verification: 'attested' | 'chain' | 'memo'; evidence: string | null }
  /** Malformed submission — nothing worth recording. */
  | { ok: false; kind: 'invalid'; reason: string }
  /** Our infrastructure failed, not the builder — nothing recorded. */
  | { ok: false; kind: 'unavailable'; reason: string }
  /** A real verdict: recorded on the completion with the feedback text.
   *  `terminal` marks rejections no retry can fix (wrong memo in a mined
   *  tx); the rest may flip to accepted on resubmission. */
  | {
      ok: false;
      kind: 'rejected';
      reason: string;
      terminal: boolean;
      verification: 'chain' | 'memo';
    };

/**
 * Decides whether a claimed step actually happened. The policy lives on the
 * step definition (lib/challenges.ts) so the UI can tell builders up front
 * what each step will require.
 *
 * 'chain' proves the transaction exists and is mined, not that this builder
 * made it — shielded transactions reveal no parties, so any mined txid would
 * pass. 'memo' closes that gap: the builder sends a shielded memo carrying
 * their builder ID to the challenge address, the challenge wallet decrypts it
 * with its own keys, and the ingest job (scripts/memo-ingest.mjs) records
 * txid → builder ID. A memo the challenge wallet decrypted could only have
 * been written by whoever built that transaction.
 */
export async function verifyStep(
  challengeSlug: string,
  stepId: string,
  evidence: { txid?: string } | undefined,
  builderId: string,
): Promise<VerificationResult> {
  const challenge = getChallenge(challengeSlug);
  if (!challenge || challenge.status !== 'live') {
    return { ok: false, kind: 'invalid', reason: 'unknown challenge' };
  }

  const step = challenge.steps.find((s) => s.id === stepId);
  if (!step) return { ok: false, kind: 'invalid', reason: 'unknown step' };

  if (step.verification === 'attested') {
    return { ok: true, verification: 'attested', evidence: null };
  }

  const txid = evidence?.txid?.toLowerCase();
  if (!txid) {
    return { ok: false, kind: 'invalid', reason: 'this step requires a txid' };
  }

  if (step.verification === 'memo') {
    const proof = await getMemoProof(txid);
    if (!proof) {
      return {
        ok: false,
        kind: 'rejected',
        verification: 'memo',
        terminal: false,
        reason:
          'memo not seen yet — the challenge wallet rescans every few minutes; if you just sent it, try again shortly',
      };
    }
    if (proof.builderId !== builderId) {
      return {
        ok: false,
        kind: 'rejected',
        verification: 'memo',
        // The memo is sealed into a mined transaction; resubmitting the
        // same txid can never change whose ID it carries.
        terminal: true,
        reason:
          'the memo in that transaction does not carry your builder ID — send it from your own wallet with the exact memo the step shows',
      };
    }
    return { ok: true, verification: 'memo', evidence: txid };
  }

  let lookup;
  try {
    lookup = await lookupTransaction(txid);
  } catch (err) {
    return {
      ok: false,
      kind: 'unavailable',
      reason: `could not reach lightwalletd: ${(err as Error).message}`,
    };
  }

  if (!lookup.found) {
    return {
      ok: false,
      kind: 'rejected',
      verification: 'chain',
      terminal: false,
      reason:
        'no such transaction on the testnet — check the txid, and give a fresh send a minute to propagate',
    };
  }
  if (!lookup.mined) {
    return {
      ok: false,
      kind: 'rejected',
      verification: 'chain',
      terminal: false,
      reason: 'transaction is not mined yet — try again shortly',
    };
  }

  return { ok: true, verification: 'chain', evidence: txid };
}
