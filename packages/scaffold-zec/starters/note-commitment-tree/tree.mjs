/**
 * Challenge #7 — Notes, Nullifiers & Proofs, steps "tree" and "nullify".
 *
 * This is Zcash's core accounting trick in miniature. Notes are never
 * "marked spent" anywhere: the chain holds an append-only tree of note
 * commitments, and spending reveals a nullifier derived from the note.
 * Nobody can link the nullifier back to the commitment, but a duplicate
 * nullifier is a double spend and anyone can see that. Build both halves
 * and the reason shielded chains work stops being abstract.
 *
 * Real Zcash uses Pedersen hashes over Jubjub (Sapling) or Sinsemilla
 * (Orchard), depth-32 trees, and zero-knowledge proofs of membership. This
 * exercise keeps the structure and swaps in SHA-256, so you can reason
 * about the shape without the cryptography in the way.
 *
 * Implement everything marked TODO. `node --test starters/` grades you.
 */

import { createHash } from 'node:crypto';

/** Tree depth. A tree of depth D holds 2**D leaves. */
export const DEPTH = 4;

/** Hash of an empty subtree slot. */
export const EMPTY_LEAF = Buffer.alloc(32);

export function sha256(...parts) {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest();
}

/**
 * Hash two child nodes into their parent. Order matters: swapping left and
 * right must produce a different parent, or a membership path proves nothing
 * about position.
 *
 * @param {Buffer} left
 * @param {Buffer} right
 * @returns {Buffer} 32 bytes
 */
export function hashPair(left, right) {
  // TODO: implement
  throw new Error('not implemented');
}

export class CommitmentTree {
  constructor(depth = DEPTH) {
    this.depth = depth;
    /** @type {Buffer[]} leaves in insertion order */
    this.leaves = [];
  }

  get capacity() {
    return 2 ** this.depth;
  }

  /**
   * Append a note commitment.
   * @param {Buffer} commitment 32 bytes
   * @returns {number} the leaf position
   * @throws if the tree is full — an append-only structure has to say so
   *         rather than silently overwrite history
   */
  append(commitment) {
    // TODO: implement
    throw new Error('not implemented');
  }

  /**
   * The anchor: the root hash over all leaves, empty slots included.
   * @returns {Buffer} 32 bytes
   */
  root() {
    // TODO: implement
    throw new Error('not implemented');
  }

  /**
   * A membership path for the leaf at `position`: the sibling hash at each
   * level, from the leaf upward.
   * @param {number} position
   * @returns {Buffer[]} exactly `depth` siblings
   */
  path(position) {
    // TODO: implement
    throw new Error('not implemented');
  }
}

/**
 * Recompute a root from a leaf and its path. A verifier runs this; it never
 * sees the whole tree. Matching the anchor is what "this note exists" means.
 *
 * @param {Buffer} leaf
 * @param {number} position
 * @param {Buffer[]} path
 * @returns {Buffer} the root this leaf and path imply
 */
export function rootFromPath(leaf, position, path) {
  // TODO: implement
  throw new Error('not implemented');
}

/**
 * The nullifier for a note. In Zcash this is derived from the note and the
 * spender's key so that only the owner can produce it and nobody else can
 * link it to the commitment. Here: hash the note secret with its position.
 *
 * @param {Buffer} noteSecret
 * @param {number} position
 * @returns {Buffer} 32 bytes
 */
export function nullifier(noteSecret, position) {
  // TODO: implement
  throw new Error('not implemented');
}

/**
 * The consensus half: a set of spent nullifiers.
 *
 * Note what this class does NOT get to see — commitments, amounts, owners.
 * A validator enforcing no-double-spend needs only the nullifier, which is
 * exactly why the rule is enforceable on a chain that hides everything else.
 */
export class NullifierSet {
  constructor() {
    /** @type {Set<string>} */
    this.spent = new Set();
  }

  /**
   * Record a spend.
   * @param {Buffer} nf
   * @throws if this nullifier was already spent (the double-spend check)
   */
  spend(nf) {
    // TODO: implement
    throw new Error('not implemented');
  }

  /** @param {Buffer} nf @returns {boolean} */
  isSpent(nf) {
    // TODO: implement
    throw new Error('not implemented');
  }
}
