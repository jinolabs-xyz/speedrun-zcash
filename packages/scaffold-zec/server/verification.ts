import { getChallenge } from '../lib/challenges';
import { lookupTransaction } from './lightwalletd';

export type VerificationResult =
  | { ok: true; verification: 'attested' | 'chain'; evidence: string | null }
  | { ok: false; reason: string };

/**
 * Decides whether a claimed step actually happened. The policy lives on the
 * step definition (lib/challenges.ts) so the UI can tell builders up front
 * what each step will require.
 *
 * Known limit: a chain check proves the transaction exists and is mined, not
 * that this builder made it — shielded transactions reveal no parties, so
 * any mined txid would pass. Closing that gap needs the memo-based proof
 * (builder ID inside an encrypted memo sent to a challenge address, read
 * back with the platform's viewing key), which is blocked on memo support in
 * WebZjs. Until then this raises the bar from "trust the client" to "the
 * chain agrees something happened", and nothing more should be claimed.
 */
export async function verifyStep(
  challengeSlug: string,
  stepId: string,
  evidence: { txid?: string } | undefined,
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

  const txid = evidence?.txid;
  if (!txid) return { ok: false, reason: 'this step requires a txid' };

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
