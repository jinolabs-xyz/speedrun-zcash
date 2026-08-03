# 🏃 Speedrun Zcash

**Go from zero to Zcash contributor.** Ten hands-on challenges that take you
from "what is a shielded transaction" to your first merged pull request in the
codebases that run Zcash.

**Live on testnet** → https://speedrun-zcash.aayushgiri1234.workers.dev

[![deploy](https://github.com/jinolabs-xyz/speedrun-zcash/actions/workflows/deploy.yml/badge.svg)](https://github.com/jinolabs-xyz/speedrun-zcash/actions/workflows/deploy.yml)

## What this is

Zcash has world-class low-level tooling and a world-class encyclopedia in
[ZecHub](https://zechub.wiki). What it lacked was the gym, a guided path where
you learn by doing, the way [Speedrun Ethereum](https://speedrunethereum.com)
does it for Ethereum. Every challenge here ends with something real. A
transaction you sent. A wallet you built. A node you ran. A pull request you
landed upstream.

You need no crypto background to start. Challenge #0 assumes nothing and
explains everything. By challenge #9 you are reading protocol code and
shipping fixes to it.

## The track

| # | Challenge | Level | You walk away with |
|---|---|---|---|
| 0 | First Shielded Transaction | Start from zero | A real wallet made in your terminal, funded from the faucet, and a shielded payment only its recipient can read |
| 1 | Watch the Chain | Start from zero | The ability to read a block explorer and explain what the network provably cannot see |
| 2 | Memo Messenger | Start from zero | Encrypted messaging over shielded memos |
| 3 | Build a Light Wallet | Build with Zcash | Your own wallet built on the light client protocol |
| 4 | Shielded Storefront | Build with Zcash | A store that detects payment with a viewing key, no account system needed |
| 5 | Viewing Keys and Selective Disclosure | Build with Zcash | Working knowledge of the key tree, and an auditor view built from a viewing key |
| 6 | Run the Stack | Under the hood | Your own node and indexer serving real light clients |
| 7 | Notes, Nullifiers, Proofs | Under the hood | The mental model of what a zero-knowledge proof actually proves |
| 8 | Ship Your Privacy App | Become a contributor | A privacy app of your own design, shipped |
| 9 | First Upstream Contribution | Become a contributor | Your first merged PR in the Zcash ecosystem |

Every challenge names the real codebase it introduces (zcash-devtool,
lightwalletd, librustzcash, Zebra, orchard, and more), so finishing the track
means you have met every library that matters and know what each one is for.

## Verification you can trust

Progress tracking is honest about what it can prove. Each step declares one of
three verification levels, and the UI labels them.

- **Attested.** Nothing lands on chain (like generating a seed), so your
  signed word is recorded as exactly that.
- **Chain.** You submit a transaction id and the server independently finds it
  mined. This proves existence, not authorship, and we say so.
- **Memo.** You send a shielded payment to the challenge address with your
  builder ID in the encrypted memo. Only a transaction's author can write its
  memo, so this is cryptographic proof the transaction was yours. Zcash gives
  us a native autograder other chains cannot have.

Your identity is a keypair created in your browser. No account, no password,
no email, and nothing that links to your wallet or addresses.

## Repo layout

| Path | What it is |
|---|---|
| [`packages/scaffold-zec/`](packages/scaffold-zec) | The platform. Next.js app with the challenge track, lesson content, verification server, and an embedded WebZjs light wallet for the in-browser challenges |
| [`scripts/install-devtool.sh`](scripts/install-devtool.sh) | Builds zcash-devtool at a revision we test end to end. Challenge #0's step one |
| [`scripts/vendor-webzjs.sh`](scripts/vendor-webzjs.sh) | Builds the WebZjs wasm packages from source into `packages/scaffold-zec/vendor/` |
| [`scripts/r2-usage-guard.mjs`](scripts/r2-usage-guard.mjs) | Daily CI check that object storage usage stays inside the free tier |
| [`docs/`](docs) | Curriculum design and research notes |

## Develop locally

```bash
cd packages/scaffold-zec
npm install
npm run dev
```

That gives you the site, the lessons, and the full verification server against
a local database. The embedded wallet used by challenges #1 and up needs the
wasm build, which is deliberately not in git (57 MB). Build it once with
`scripts/vendor-webzjs.sh` (needs Rust nightly and zig, the script explains
itself). Challenge #0 needs no wasm at all, its wallet is the learner's own
terminal.

## How it deploys

Every commit on `master` ships to production automatically. The workflow
builds the app with OpenNext for Cloudflare Workers, deploys, then smoke-tests
the live deployment and fails red if anything broke. The wasm is served from
R2 through an edge cache, progress lives in D1, and a daily job alarms before
usage can leave the free tier.

## Contributing

The [issue tracker](https://github.com/jinolabs-xyz/speedrun-zcash/issues) is
the roadmap, and issues describe the problem and the intended shape of the
fix. Lesson content lives in
[`lib/challenges.ts`](packages/scaffold-zec/lib/challenges.ts). Corrections
with sources are the most valuable PRs a curriculum can get.

If the track itself teaches you enough to fix something here, that is the
product working as intended. Challenge #9 exists for exactly that moment.

## The ecosystem this points at

- [zcash-devtool](https://github.com/zcash/zcash-devtool), the multitool you
  meet in challenge #0
- [Zcash testnet faucet](https://zcashfaucet.jinolabs.xyz), funds every run
  through the track
- [ZecHub](https://zechub.wiki), the encyclopedia we link instead of rewriting
- [librustzcash](https://github.com/zcash/librustzcash),
  [Zebra](https://github.com/ZcashFoundation/zebra),
  [lightwalletd](https://github.com/zcash/lightwalletd), the codebases the
  track funnels contributors toward

## License

[MIT](LICENSE)
