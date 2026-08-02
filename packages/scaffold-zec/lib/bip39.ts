/**
 * BIP39 mnemonic → 64-byte seed (PBKDF2-HMAC-SHA512, 2048 rounds, empty
 * passphrase), matching librustzcash's `Mnemonic::to_seed("")` so keys
 * derived here agree with the ones the wallet derives internally.
 */
export async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(mnemonic.normalize('NFKD')),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-512',
      salt: enc.encode('mnemonic'),
      iterations: 2048,
    },
    key,
    512,
  );
  return new Uint8Array(bits);
}
