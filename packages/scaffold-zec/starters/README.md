# Challenge starters

Each folder is a stubbed exercise plus the test suite that grades it. Nothing
to install: the tests use Node's built-in runner, so a checkout and a Node 18+
runtime are the whole setup.

```sh
npm run test:starters              # everything
node --test starters/note-commitment-tree/   # one exercise
```

A fresh checkout fails almost every test. That is the starting line — fill in
the functions marked `TODO` until the suite is green.

| Folder | Challenge | What you build |
|---|---|---|
| `zip321-payment-requests/` | #4 Shielded Storefront | Build and parse ZIP 321 payment URIs, the request format that carries an order ID into a shielded payment |
| `note-commitment-tree/` | #7 Notes, Nullifiers & Proofs | A commitment tree with membership paths and a nullifier set: how a chain that hides everything still prevents double spends |

The suites test behaviour, not implementation — how you get there is yours.
Where a test looks oddly specific it is usually guarding a real failure mode,
and the comment above it says which one.

No starter here for the viewing-key auditor (#5). That exercise runs entirely
through `zcash-devtool` (`init-fvk`, `sync`, `balance`), and the thing worth
learning is what a viewing key does and does not expose. Wrapping those
commands in a test would grade the wrapper, not the understanding.
