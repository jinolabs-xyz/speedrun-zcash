# Speedrun Zcash — Proposed Curriculum

> **Live track note (July 2026):** the shipped curriculum lives in
> `packages/scaffold-zec/lib/challenges.ts` — ten challenges (#0–#9) in four
> levels, ending in an upstream-contribution capstone, with one ecosystem
> codebase spotlighted per challenge. It diverges from the proposal below in
> two ways: a gentle "Watch the Chain" challenge was inserted at #1 to slow
> the early ramp, and Mobile (#6 below) and Interop (#8 below) moved to the
> side-quest pool in favor of "Your First Upstream Contribution" as #9.

> Modeled on Speedrun Ethereum, adapted to Zcash's reality: there are no smart
> contracts, so challenges produce **deployed apps, live infrastructure, and
> verifiable testnet transactions** instead of deployed contracts. The
> curriculum is built around Zcash's actual superpowers — shielded payments,
> encrypted memos, viewing keys, and light clients — and its gotchas.

## Design principles (stolen from Speedrun Ethereum)

1. **Every challenge ships something public and verifiable.** In Ethereum it's
   a contract address; in Zcash it's a testnet txid, a live app URL, or a
   viewing key a reviewer can use to verify your work on-chain.
2. **Progressive unlock.** Complete challenge N → challenge N+1 unlocks.
   Early challenges are hours, later ones are days.
3. **Teach the gotchas, not just the happy path.** Transparent-vs-shielded
   leakage, memo size limits, sync latency, note management — each challenge
   has a deliberate "here's how people get this wrong" moment.
4. **One batteries-included starter kit.** Speedrun Ethereum rides on
   Scaffold-ETH 2. Speedrun Zcash needs a **"Scaffold-ZEC"**: one command that
   gives you a Next.js front end wired to WebZjs (WASM light client), a
   testnet lightwalletd endpoint, prebuilt components (`<ShieldedBalance>`,
   `<PayButton>`, `<MemoFeed>`), and zcash-devtool for CLI work. This is the
   prerequisite build for the whole platform.
5. **Graduation has a destination.** Finishing the core track feeds into a
   builder community ("Shielded Guild" / batches) and a guided Zcash Community
   Grants application — the BuidlGuidl analog.

## The killer mechanic: autograding via the chain itself

Zcash gives us a native autograder Speedrun Ethereum doesn't have:

- **Proof of completion = a shielded transaction.** Each challenge has a
  challenge address; you submit by sending a testnet tx whose **encrypted memo
  contains your builder ID + challenge ID**. The platform holds the viewing
  key, scans incoming notes, and auto-verifies completion. Learners prove
  mastery *by using the protocol itself*.
- **App verification via viewing keys.** For app challenges, you submit your
  app's viewing key so reviewers can verify real payment flows happened —
  teaching selective disclosure as a side effect.

---

## The Curriculum

### Challenge 0 — 🏁 Setup & First Shielded Transaction
**Build:** Install the toolchain (zcash-devtool or Zingo CLI), create a wallet,
grab testnet ZEC from the faucet, and send your first fully shielded
transaction with a memo containing your builder ID (this *is* the platform
registration).
**Learn:** Transparent vs. Sapling vs. Orchard pools, unified addresses (UAs),
what a note is, why "shielded by default" matters, block explorers and what
they *can't* see.
**Gotcha:** Send one transparent tx too — and look at how much it leaks.
**Submit:** The txid of your registration memo tx (auto-verified).

### Challenge 1 — 💬 Memo Messenger
**Build:** A CLI or minimal web app that turns Zcash into an encrypted
messaging layer: send memos to a friend, scan and decrypt your inbox, thread
conversations by address.
**Learn:** The 512-byte encrypted memo field, trial decryption, incoming
viewing keys, fee mechanics (ZIP-317), why memos are E2E-encrypted for free.
**Gotcha:** Memo size limits and what metadata still leaks (timing, fees).
**Submit:** Live app/repo + a memo conversation the grader's viewing key can read.

### Challenge 2 — 👛 Build a Light Wallet
**Build:** A minimal web wallet from scratch with WebZjs (or Rust +
librustzcash): generate a seed, derive unified addresses, sync via
lightwalletd, show balances per pool, send a shielded payment.
**Learn:** The light client protocol, compact blocks, note commitment trees at
the user level, seed phrases and key derivation (ZIP-32), sync UX.
**Gotcha:** Sync latency and why wallets "hang" — then fix the UX for it.
**Submit:** Deployed wallet URL + a payment sent from it to the challenge address.

### Challenge 3 — 🛒 Shielded Storefront (Payment Gateway)
**Build:** A web store that sells digital goods for testnet ZEC: generate
ZIP-321 payment request URIs/QR codes, detect incoming payments with a viewing
key, auto-deliver the product on confirmation.
**Learn:** ZIP-321 payment URIs, payment detection without holding spend keys,
confirmations and reorg safety, per-order address/memo schemes.
**Gotcha:** Matching payments to orders when everything is encrypted — the memo
is your order ID.
**Submit:** Live store URL + the store's viewing key so the grader can buy
something and see it detected.

### Challenge 4 — 🔍 Viewing-Key Auditor
**Build:** An audit dashboard: paste a viewing key, get a full history of
incoming (and with a full viewing key, outgoing) shielded activity — balances
over time, memos, counterparty addresses. Add payment disclosure export for
proving a single payment to a third party.
**Learn:** Selective disclosure — Zcash's defining superpower. Incoming vs.
full viewing keys, per-transaction disclosures, compliance/audit use cases.
**Gotcha:** What a viewing key holder can and cannot learn; revocation is
impossible — design accordingly.
**Submit:** Deployed dashboard demonstrated against the grader's public test
viewing key.

### Challenge 5 — 🖥️ Run the Stack
**Build:** Stand up your own infrastructure: a Zebra testnet node + a
lightwalletd/Zaino indexer, exposed at a public endpoint. Point your
Challenge-2 wallet at your own backend instead of the community one.
**Learn:** Node operations, the role of the indexer, compact block serving,
RPC surface, what trusting a lightwalletd operator means for privacy.
**Gotcha:** What a malicious lightwalletd can learn about its users.
**Submit:** Your public endpoint URL; the platform syncs a probe wallet
against it to verify.

### Challenge 6 — 📱 Mobile Shielded App
**Build:** A small Android or iOS app using the official Zcash mobile SDKs: a
tip-jar or point-of-sale app that displays a QR payment request and shows a
"paid!" screen when the shielded payment lands.
**Learn:** Mobile SDK architecture, background sync, key storage on device,
real-world payment UX.
**Submit:** Repo + demo video + a payment made through the app.

### Challenge 7 — 🧠 Under the Hood: Notes, Nullifiers & Proofs
**Build:** A working toy model of the shielded pool in Rust or TypeScript:
note commitments in a Merkle tree, nullifiers preventing double-spends, and a
simple ZK circuit "hello world" (e.g., prove knowledge of a note preimage —
Halo 2 or a beginner-friendly proving stack).
**Learn:** What actually happens when you spend a note: commitments,
nullifiers, anchors, and how zero-knowledge proofs tie it together without
revealing anything. Why Orchard/Halo 2 removed the trusted setup.
**Gotcha:** Why nullifiers must be deterministic but unlinkable.
**Submit:** Repo with passing test suite (auto-run in CI).

### Challenge 8 — 🌉 Shielded Swaps / Interop
**Build:** An app that gets value into or out of the shielded pool across
chains — e.g., integrate a swap provider (Zcash Router SDK / NEAR Intents /
Maya-style flow) to swap testnet assets into shielded ZEC, or build a
"shield-on-receive" auto-shielding service.
**Learn:** The interop landscape, transparent-pool touchpoints and their
privacy cost, auto-shielding patterns.
**Gotcha:** Every bridge/swap is a deanonymization surface — map the leakage.
**Submit:** Live app + demo transaction trail.

### Challenge 9 — 🚀 Capstone: Ship an Original Privacy App
**Build:** Your own idea, built on everything above — private payroll,
anonymous donations with public proof-of-receipt via disclosures, shielded
subscriptions, private crowdfunding (the Zcash answer to Speedrun Ethereum's
staking challenge), whatever.
**Learn:** Scoping, shipping, and pitching.
**Submit:** Deployed app + write-up. Reviewed by humans (the guild), not
autograded. Completion = invitation into the builder community + guided
walkthrough of a Zcash Community Grants application for those who want to
keep building.

---

## Side quests (optional, non-blocking)

- **FROST multisig:** set up a threshold-signature shielded wallet.
- **Zcash + AI agents:** an agent that pays for API calls with shielded ZEC.
- **Documentation PR:** land a real docs/tooling improvement upstream
  (zechub, zcash-devtool, WebZjs) — teaches open-source contribution.

## Platform mechanics summary

| Speedrun Ethereum | Speedrun Zcash equivalent |
|---|---|
| Deploy contract to testnet | Testnet txid / live app / running node |
| Autograder reads contract state | Platform viewing key scans challenge address for memo proofs |
| Scaffold-ETH 2 starter | **Scaffold-ZEC** (WebZjs + Next.js + devtool) — must be built first |
| Unlock next challenge | Same — memo-verified progression |
| Join BuidlGuidl → batches → streams | Join builder guild → batches → guided ZCG grant application |
| Portfolio of deployed contracts | Portfolio of live apps + verifiable shielded activity |

## Sequencing of the build itself

1. **Scaffold-ZEC** starter kit (nothing works without it).
2. Challenges 0–2 + the memo-based autograder (the MVP loop).
3. Public launch with 0–4; add 5–9 as they're polished.
4. Community layer (guild, batches, ZCG pipeline) once there are graduates.
