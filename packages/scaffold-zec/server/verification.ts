import { getChallenge } from '../lib/challenges';
import { lookupTransaction } from './lightwalletd';
import { getMemoProof } from './db';

export type VerificationResult =
  | { ok: true; verification: 'attested' | 'chain' | 'memo'; evidence: string | null }
  | { ok: false; reason: string };

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
    return { ok: false, reason: 'unknown challenge' };
  }

  const step = challenge.steps.find((s) => s.id === stepId);
  if (!step) return { ok: false, reason: 'unknown step' };

  if (step.verification === 'attested') {
    return { ok: true, verification: 'attested', evidence: null };
  }

  const txid = evidence?.txid?.toLowerCase();
  if (!txid) return { ok: false, reason: 'this step requires a txid' };

  if (step.verification === 'memo') {
    const proof = await getMemoProof(txid);
    if (!proof) {
      return {
        ok: false,
        reason:
          'memo not seen yet — the challenge wallet rescans every few minutes; if you just sent it, try again shortly',
      };
    }
    if (proof.builderId !== builderId) {
      return {
        ok: false,
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
      reason: `could not reach lightwalletd: ${(err as Error).message}`,
    };
  }

  if (!lookup.found) return { ok: false, reason: 'no such transaction' };
  if (!lookup.mined) {
    return { ok: false, reason: 'transaction is not mined yet — try again shortly' };
  }

  return { ok: true, verification: 'chain', evidence: txid };
}
