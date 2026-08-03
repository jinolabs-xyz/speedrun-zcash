import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CommitmentTree,
  NullifierSet,
  DEPTH,
  EMPTY_LEAF,
  hashPair,
  nullifier,
  rootFromPath,
  sha256,
} from './tree.mjs';

/**
 * Assert that `fn` rejects its input on the merits. A bare assert.throws
 * would also pass against an unimplemented stub, telling you a validation
 * test is green before you have written any validation.
 */
function rejects(fn, why) {
  assert.throws(fn, (err) => {
    assert.doesNotMatch(
      err.message,
      /not implemented/,
      'still a stub, so this test cannot pass yet',
    );
    return true;
  }, why);
}

const note = (n) => sha256(Buffer.from(`note-${n}`));

test('hashPair is order sensitive', () => {
  const a = note(1);
  const b = note(2);
  assert.notDeepEqual(hashPair(a, b), hashPair(b, a));
});

test('hashPair returns 32 bytes', () => {
  assert.equal(hashPair(note(1), note(2)).length, 32);
});

test('append returns increasing positions', () => {
  const tree = new CommitmentTree();
  assert.equal(tree.append(note(1)), 0);
  assert.equal(tree.append(note(2)), 1);
  assert.equal(tree.append(note(3)), 2);
});

test('the root changes when a note is added', () => {
  const tree = new CommitmentTree();
  const before = tree.root();
  tree.append(note(1));
  assert.notDeepEqual(tree.root(), before);
});

test('the root is stable for the same leaves', () => {
  const a = new CommitmentTree();
  const b = new CommitmentTree();
  for (const n of [1, 2, 3]) {
    a.append(note(n));
    b.append(note(n));
  }
  assert.deepEqual(a.root(), b.root());
});

// Position is part of what a commitment tree commits to.
test('insertion order changes the root', () => {
  const a = new CommitmentTree();
  a.append(note(1));
  a.append(note(2));
  const b = new CommitmentTree();
  b.append(note(2));
  b.append(note(1));
  assert.notDeepEqual(a.root(), b.root());
});

test('an empty tree still has a root', () => {
  assert.equal(new CommitmentTree().root().length, 32);
});

test('the tree refuses to exceed its capacity', () => {
  const tree = new CommitmentTree(2);
  for (let i = 0; i < 4; i++) tree.append(note(i));
  rejects(() => tree.append(note(99)));
});

test('a path has one sibling per level', () => {
  const tree = new CommitmentTree();
  tree.append(note(1));
  assert.equal(tree.path(0).length, DEPTH);
});

test('a path recomputes the anchor', () => {
  const tree = new CommitmentTree();
  const positions = [0, 1, 2].map((n) => tree.append(note(n)));
  for (const position of positions) {
    assert.deepEqual(
      rootFromPath(note(position), position, tree.path(position)),
      tree.root(),
      `path for leaf ${position} should rebuild the anchor`,
    );
  }
});

test('a path proves nothing for a leaf that is not there', () => {
  const tree = new CommitmentTree();
  tree.append(note(1));
  assert.notDeepEqual(
    rootFromPath(note(999), 0, tree.path(0)),
    tree.root(),
    'a forged leaf must not rebuild the anchor',
  );
});

// The same note at a different position is a different nullifier, which is
// what keeps two identical-value notes from colliding.
test('nullifiers depend on position', () => {
  assert.notDeepEqual(nullifier(note(1), 0), nullifier(note(1), 1));
});

test('nullifiers are deterministic', () => {
  assert.deepEqual(nullifier(note(1), 3), nullifier(note(1), 3));
});

test('spending twice is refused', () => {
  const spent = new NullifierSet();
  const nf = nullifier(note(1), 0);
  spent.spend(nf);
  rejects(() => spent.spend(nf), 'a second spend must be rejected');
});

test('different notes spend independently', () => {
  const spent = new NullifierSet();
  spent.spend(nullifier(note(1), 0));
  spent.spend(nullifier(note(2), 1));
  assert.ok(spent.isSpent(nullifier(note(1), 0)));
  assert.ok(!spent.isSpent(nullifier(note(3), 2)));
});

// Buffers are compared by value here; a Set of Buffer objects compares by
// identity and would let every double spend through.
test('an equal nullifier from a fresh buffer is still spent', () => {
  const spent = new NullifierSet();
  spent.spend(nullifier(note(1), 0));
  assert.ok(spent.isSpent(Buffer.from(nullifier(note(1), 0))));
});

test('empty leaves are the zero hash, not undefined', () => {
  assert.equal(EMPTY_LEAF.length, 32);
});
