import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// @noble/ed25519 v3 ships without a bundled hash. Wiring it in one place
// keeps the browser's signing and the server's verification on identical
// primitives — they must agree exactly or every signature fails.
ed.hashes.sha512 = sha512;

export { ed };
