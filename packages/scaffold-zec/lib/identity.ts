import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { ed } from './ed25519';

/**
 * Builder identity, derived entirely from the wallet seed.
 *
 * There are no accounts or passwords: restoring your seed on any machine
 * reproduces the same builder. Both values below are domain-separated HKDF
 * outputs rather than anything the wallet uses internally — publishing a
 * builder ID must not correlate with on-chain activity or wallet-internal
 * identifiers (ZIP-32 seed fingerprints, viewing keys, addresses).
 *
 * The signing key never leaves the browser; the server only ever sees the
 * public key and signatures over nonces it issued.
 */

const SALT = new TextEncoder().encode('speedrun-zcash');
const ID_INFO = new TextEncoder().encode('builder-id-v1');
const AUTH_INFO = new TextEncoder().encode('builder-auth-v1');

export interface BuilderIdentity {
  builderId: string;
  publicKey: string;
  sign(message: string): string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function deriveIdentity(seed: Uint8Array): BuilderIdentity {
  const builderId = toHex(hkdf(sha256, seed, SALT, ID_INFO, 16));
  const secretKey = hkdf(sha256, seed, SALT, AUTH_INFO, 32);
  const publicKey = toHex(ed.getPublicKey(secretKey));

  return {
    builderId,
    publicKey,
    sign: (message: string) =>
      toHex(ed.sign(new TextEncoder().encode(message), secretKey)),
  };
}
