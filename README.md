# 🏃 Speedrun Zcash

**Learn to build on Zcash by shipping real privacy apps** — a
[Speedrun Ethereum](https://speedrunethereum.com)-style curriculum and platform
for the Zcash ecosystem.

> Status: **early scaffolding**. We are building the foundation first:
> **Scaffold-ZEC**, a batteries-included starter kit (Next.js + WebZjs WASM
> light client) that every challenge will ride on — the Scaffold-ETH 2 of Zcash.

## Why

Zcash has solid low-level tooling (librustzcash, Zebra, mobile SDKs, WebZjs)
but no guided, challenge-based on-ramp for developers. Speedrun Ethereum showed
the recipe: a starter kit that gets a beginner to a working full-stack app in
minutes, plus progressive challenges that each ship something publicly
verifiable. See [docs/curriculum.md](docs/curriculum.md) for the full
10-challenge curriculum design.

Zcash even gives us a native autograder Ethereum doesn't have: challenge
completion is proven by sending a **shielded testnet transaction with your
builder ID in the encrypted memo** to a challenge address — the platform holds
the viewing key and verifies on-chain.

## What's in this repo today

| Path | What it is |
|---|---|
| [`packages/scaffold-zec/`](packages/scaffold-zec) | The starter kit: Next.js app with an in-browser Zcash **testnet** light wallet (WebZjs) — create a wallet, sync via lightwalletd, view shielded balance, send shielded ZEC |
| [`scripts/vendor-webzjs.sh`](scripts/vendor-webzjs.sh) | Builds the WebZjs WASM packages from source (they are not yet on npm) into `packages/scaffold-zec/vendor/` |
| [`infra/run-testnet-proxy.sh`](infra/run-testnet-proxy.sh) | Local gRPC-web proxy → public testnet lightwalletd (`testnet.zec.rocks:443`) — required because browsers can't speak raw gRPC |
| [`docs/`](docs) | Curriculum design + research notes, including [WebZjs API notes](docs/webzjs-api-notes.md) |

## Quickstart

Prereqs: Node ≥ 20, Rust (rustup), Go (for `grpcwebproxy`).

```bash
# 1. Build the WebZjs WASM packages (one-time, ~10-20 min)
./scripts/vendor-webzjs.sh

# 2. Run a local gRPC-web proxy to the public testnet lightwalletd
./infra/run-testnet-proxy.sh   # serves http://localhost:8080

# 3. Run the starter app
cd packages/scaffold-zec
npm install
npm run dev                    # http://localhost:3000
```

Get testnet ZEC from the [testnet faucet](https://faucet.zecpages.com/) to
play with sending.

## Roadmap

1. **Scaffold-ZEC MVP** (this repo, now): wallet create/restore, sync,
   shielded balance, send — the components every challenge needs.
2. **Memo support**: WebZjs currently builds payments with
   `Payment::without_memo` — memo sending isn't exposed yet. Upstreaming this
   to [ChainSafe/WebZjs](https://github.com/ChainSafe/WebZjs) unblocks the
   memo-based autograder and Challenge 1 (Memo Messenger).
3. **Challenges 0–2** + the memo autograder (platform holds a viewing key,
   scans a challenge address, auto-verifies completions).
4. **Platform site**: challenge pages, progressive unlock, builder profiles.
5. **Community layer**: builder guild, batches, guided Zcash Community Grants
   pipeline.

## Contributing

Early days — issues and PRs welcome. The highest-impact contribution right now
is memo support in WebZjs (see roadmap #2).

## License

MIT
