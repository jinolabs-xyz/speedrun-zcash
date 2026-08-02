# WebZjs API notes (verified against source, July 2026)

Findings from reading [ChainSafe/WebZjs](https://github.com/ChainSafe/WebZjs)
source — `crates/webzjs-wallet/src/wallet.rs`, `crates/webzjs-keys/src/keys.rs`,
and the demo app in `packages/web-wallet/`.

## Distribution

- `@chainsafe/webzjs-wallet` is **not published to npm** — must be built from
  source with wasm-pack (see `scripts/vendor-webzjs.sh`). Only
  `@chainsafe/webzjs-keys@0.1.0` and the MetaMask snap are on npm.
- Build requires Rust **nightly** (`-Z build-std`) and a clang that targets
  `wasm32-unknown-unknown` for the C in `secp256k1-sys` (Apple clang can't —
  use Homebrew LLVM or the Docker build path).
- A third-party fork publish exists (`zprotocol-webzjs-wallet`, single
  maintainer, 60 MB) — avoided for provenance reasons.

## Setup requirements

- **gRPC-web proxy required**: browsers can't speak raw gRPC to lightwalletd.
  Public testnet backend: `testnet.zec.rocks:443` (used by WebZjs's own
  `just run-test-proxy`). Proxy with `grpcwebproxy`.
- **Cross-origin isolation required**: the WASM thread pool uses
  SharedArrayBuffer → serve with
  `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp`.
- Init sequence (once per page): `await init()` (both packages), then
  `await initThreadPool(navigator.hardwareConcurrency)`.

## Wallet API (`@chainsafe/webzjs-wallet`)

```ts
const wallet = new WebWallet(
  'test',                     // network: 'main' | 'test'
  'http://localhost:8080',    // lightwalletd gRPC-WEB proxy URL
  1, 1,                       // min confirmations (trusted, untrusted)
  dbBytes ?? null,            // optional serialized db to restore
);

await wallet.create_account(name, seedPhrase, hdIndex, birthdayHeight);
await wallet.import_ufvk(...);              // watch-only via viewing key(!)
await wallet.sync();                        // runs in webworker
const summary = await wallet.get_wallet_summary();
// summary.fully_scanned_height
// summary.account_balances: [accountId, { sapling_balance, orchard_balance,
//   unshielded_balance, pending_change, pending_spendable }][]
const height = await wallet.get_latest_block();          // bigint
const ua = await wallet.get_current_address(accountId);
const ta = await wallet.get_current_address_transparent(accountId);
await wallet.transfer(seedPhrase, hdIndex, accountId, toAddress, valueZats);
const bytes = await wallet.db_to_bytes();   // persist to IndexedDB

// PCZT flow (used by the MetaMask snap path):
// pczt_create → pczt_prove → (external sign) → pczt_send; pczt_shield
```

## Keys API (`@chainsafe/webzjs-keys`)

```ts
generate_seed_phrase(): string            // 24 words
new UnifiedSpendingKey(network, seedBytes, hdIndex)
usk.to_unified_full_viewing_key()
new UnifiedFullViewingKey(network, encoded)
ufvk.encode(network)
```

## ⚠️ Gaps relevant to Speedrun Zcash

1. **No memo support**: `propose_transfer` and `pczt_create` both build
   `Payment::without_memo(...)` (wallet.rs lines ~322 and ~627). The
   memo-based challenge autograder and the Memo Messenger challenge need
   memos — **upstream PR opportunity**: thread an optional memo through
   `TransactionRequest`'s `Payment::new(...)`.
2. `transfer()` takes the seed phrase per call (no session keystore) — fine
   for a testnet starter, worth wrapping later.
3. `import_ufvk` gives watch-only wallets — this is the building block for
   the storefront (Challenge 3) and viewing-key auditor (Challenge 4).
4. Library is pre-audit, under active development — testnet only.
