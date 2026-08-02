/**
 * The exact bytes a builder signs to prove key ownership. Shared by the
 * browser and the verifying route so the two can never drift apart. Prefixed
 * so a signature produced here can't be replayed as anything else.
 */
export function authMessage(nonce: string): string {
  return `speedrun-zcash:auth:${nonce}`;
}
