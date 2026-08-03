export interface ChallengeStep {
  id: string;
  title: string;
  detail: string;
  /**
   * How the server confirms this step.
   * 'attested' means nothing lands on chain (for example generating a seed),
   *   so the builder's signed word is all there is, recorded as such and not
   *   as proof.
   * 'chain' means a txid the server independently looks up on lightwalletd.
   *   Shielded transactions hide amounts and parties, so existence and
   *   inclusion in a block is exactly what can be verified.
   * 'memo' means the builder sends a shielded memo carrying their builder ID
   *   to the challenge address, and the server finds it after the challenge
   *   wallet decrypts it. Unlike 'chain' this proves authorship: only the
   *   transaction's author can put text in its encrypted memo.
   */
  verification: 'attested' | 'chain' | 'memo';
}

/**
 * The curriculum is a single interactive track. Start knowing nothing about
 * Zcash or crypto at all, and finish as an intermediate contributor to the
 * codebases the ecosystem actually runs on. Early lessons explain like
 * you're five, and the training wheels come off gradually.
 *
 * Deliberately not an encyclopedia (ZecHub already is one). Every level here
 * is something you DO against a live wallet, in the spirit of Speedrun
 * Ethereum.
 */
export type Level = 'foundations' | 'applied' | 'protocol' | 'capstone';

export const LEVELS: { id: Level; label: string; outcome: string }[] = [
  {
    id: 'foundations',
    label: 'Start from zero',
    outcome:
      'No crypto background needed. You send money nobody can see, and can explain how, in plain words.',
  },
  {
    id: 'applied',
    label: 'Build with Zcash',
    outcome:
      'You ship real things people can use, like wallets, payments, and encrypted messaging, all on the light client protocol.',
  },
  {
    id: 'protocol',
    label: 'Under the hood',
    outcome:
      'You run your own node and indexer, and reason about keys, disclosure, and what the proofs actually prove.',
  },
  {
    id: 'capstone',
    label: 'Become a contributor',
    outcome:
      'You ship a privacy app of your own, then land your first pull request in the codebases that run Zcash.',
  },
];

/**
 * A lesson paragraph, or a command the learner runs. Commands render as
 * copyable blocks, Speedrun Ethereum style: nobody should have to fish a
 * command out of a prose sentence. `expect` is the one-line summary of
 * what success looks like, shown under the command.
 */
export type LessonBlock = string | { cmd: string; expect?: string };

export interface LessonSection {
  heading: string;
  body: LessonBlock[];
}

export interface Challenge {
  slug: string;
  number: number;
  emoji: string;
  title: string;
  tagline: string;
  status: 'live' | 'soon';
  level: Level;
  /**
   * Honest sizing, shown before a learner commits. estMinutes is active
   * time at the keyboard; background waits (node sync, mining) are called
   * out in the lesson itself, not hidden in this number.
   */
  difficulty: 'intro' | 'easy' | 'medium' | 'hard';
  estMinutes: number;
  skills: string[];
  /**
   * The real ecosystem codebase this challenge introduces. Ten challenges,
   * ten spotlights, so by the end the learner has met every library that
   * matters and knows what each one is for.
   */
  codebase: { name: string; repo: string; whatItDoes: string };
  /** Lesson sections rendered before the interactive part */
  lesson: LessonSection[];
  steps: ChallengeStep[];
  gotcha?: { heading: string; body: string[] };
  /**
   * Set to false for challenges the learner runs from their own terminal.
   * The page then skips booting the embedded wasm wallet (a 57 MB download)
   * and the run panel asks for txids instead of reading them from wallet
   * state.
   */
  embeddedWallet?: false;
}

/**
 * Where memo proofs go: the platform's challenge wallet. Learners send a
 * small amount here with a `srz1:<builderId>` memo; only the transaction's
 * author can write its encrypted memo, so a decrypted memo carrying the
 * builder's ID proves authorship. The matching viewing key lives with the
 * server-side ingest job, never in this repo.
 */
/** "~45 min" under an hour, "~2 h" and "~1.5 h" above it. */
export function formatEstMinutes(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = minutes / 60;
  return `~${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export const CHALLENGE_MEMO_ADDRESS =
  'utest1c0xwdeqrmysuvkztgaf8r4ldpr73vuunxyhumtxn9llhwqzls3clsy3duvjewxa6evtzfyvxjzt0gzxqzt6h4d0vnnhjnlgm65pz88x4gcnazyee8g9mnjdged79k2uhwrgwture7xvmfj5456kp9qume0n6qtqja5phmhhrn4c4c0epe5j750qxzsegts0myny7qvpmth4979u4ysa';

export const challenges: Challenge[] = [
  {
    slug: 'first-shielded-transaction',
    number: 0,
    difficulty: 'intro',
    estMinutes: 45,
    emoji: '🏁',
    title: 'First Shielded Transaction',
    tagline:
      'Create a real wallet from your terminal, fund it from the faucet, and send a payment nobody can see.',
    status: 'live',
    level: 'foundations',
    skills: ['Shielded pools', 'Unified addresses', 'Testnet', 'zcash-devtool'],
    codebase: {
      name: 'zcash-devtool',
      repo: 'https://github.com/zcash/zcash-devtool',
      whatItDoes:
        'The Swiss army knife the Zcash core developers themselves use. One command line tool that creates wallets, syncs the chain, sends shielded payments, and inspects any Zcash address or transaction you throw at it. You will use the same tool they do, from day one.',
    },
    embeddedWallet: false,
    lesson: [
      {
        heading: 'Money that keeps secrets',
        body: [
          'Picture this. Every time you pay for anything, you write the amount, your name, and who you paid on a postcard, then mail it for the whole world to read, forever. That is how most blockchains work. Bitcoin is a public postcard system.',
          'Zcash is money in a sealed envelope. The network can check the envelope is legitimate, that the money is real and nobody is spending the same coin twice, without ever opening it. The trick that makes this possible is called a zero-knowledge proof, a way to prove something is true without revealing why. You are about to use one for real.',
          'This is a command by command walkthrough. Copy each block, run it, check you see what the expected line says, and move on. The coins are testnet, play money that is deliberately worthless, so nothing can go wrong that matters. The tool you are about to install is the same one the Zcash core developers use every day.',
        ],
      },
      {
        heading: 'Postcards versus envelopes',
        body: [
          'Zcash is one chain, but money on it lives in different "pools". The transparent pool is the postcard system. Addresses start with t, and anyone can look up every transaction. It exists for compatibility with the Bitcoin-style world.',
          'The shielded pools are the sealed envelopes, where sender, receiver, and amount are all encrypted. There have been three generations of them, Sapling, then Orchard, then Ironwood, the newest, added by the latest network upgrade. A shielded balance is a set of encrypted "notes" that only your keys can read. When you spend one, the network checks a zero-knowledge proof that the money exists and is yours, and learns nothing else.',
        ],
      },
      {
        heading: 'Checkpoint 1 · Install the toolbox',
        body: [
          'You need Rust. If you do not have it, rustup.rs gives you one command that installs everything. Then download our install script.',
          {
            cmd: 'curl -fsSL https://raw.githubusercontent.com/jinolabs-xyz/speedrun-zcash/master/scripts/install-devtool.sh -o install-devtool.sh',
            expect: 'Downloads a 30 line shell script into your current folder.',
          },
          'Read it before you run it. This habit will keep rewarding you for the rest of your career.',
          {
            cmd: 'cat install-devtool.sh',
            expect: 'It clones zcash-devtool, pins a revision we have tested end to end, and builds it. Nothing else.',
          },
          {
            cmd: 'sh install-devtool.sh',
            expect: 'A few minutes of compiling, then "Done. Your binary: ~/zcash-devtool/target/release/zcash-devtool".',
          },
          'Give the binary a short name for the rest of the run. If you close your terminal, just run this line again.',
          {
            cmd: 'export DT=~/zcash-devtool/target/release/zcash-devtool',
            expect: 'No output. $DT now runs the tool.',
          },
        ],
      },
      {
        heading: 'Checkpoint 2 · Create your wallet',
        body: [
          'Make the folder first. The next command writes a key file into it and will not create the folder for you.',
          {
            cmd: 'mkdir -p ~/zec-wallet',
            expect: 'No output, which is how most things go well in a terminal.',
          },
          {
            cmd: '$DT wallet -w ~/zec-wallet init --name mine -i ~/zec-wallet/identity.txt -n test',
            expect: 'Prints "Generating a new age identity to encrypt the mnemonic phrase". Your wallet now exists, with a freshly generated 24 word seed encrypted inside it.',
          },
          'That folder IS the wallet. The seed inside it is the secret everything else derives from, and it never leaves your machine. Now pull the chain and look at what you hold.',
          {
            cmd: '$DT wallet -w ~/zec-wallet sync',
            expect: 'Scans to the chain tip. Seconds, because a brand new wallet has no history to find.',
          },
          {
            cmd: '$DT wallet -w ~/zec-wallet balance',
            expect: 'A dump of internal sync state first, then the part you want at the bottom: every pool at 0.00000000 TAZ. For now.',
          },
          {
            cmd: '$DT wallet -w ~/zec-wallet list-addresses',
            expect: 'Your Unified Address, one long string starting with utest1. Copy it, the faucet wants it next.',
          },
          'A Unified Address bundles receivers for several pools into one string, so whoever pays you lands in a shielded pool without thinking about it.',
        ],
      },
      {
        heading: 'Checkpoint 3 · Fund it from the faucet',
        body: [
          'Open zcashfaucet.jinolabs.xyz, paste your Unified Address, and claim a drip. The faucet page shows you the transaction id of your drip. Keep it, the run panel below asks for it as evidence. Then watch the money arrive.',
          {
            cmd: '$DT wallet -w ~/zec-wallet sync',
            expect: 'Picks up the drip once it is mined, usually within a couple of minutes. Rerun it if the balance is still empty.',
          },
          {
            cmd: '$DT wallet -w ~/zec-wallet balance',
            expect: '0.1 TAZ, listed under Ironwood.',
          },
          'It landed in Ironwood because a modern sender paying a Unified Address prefers the newest pool. You just watched pool selection happen, which most wallet users never see.',
          'One more wait before the last checkpoint. Money someone else sent you is not spendable the instant it arrives: the wallet wants ten confirmations on it, which on testnet is roughly ten to fifteen minutes. Try to spend sooner and the send fails saying you have insufficient funds, which is confusing, because the balance is right there. The rule exists because spending a note the moment it lands makes your transaction stand out from everyone else\u2019s, and standing out is the one thing a privacy chain cannot afford. Rerun balance until the amount shows as spendable, then continue.',
        ],
      },
      {
        heading: 'Checkpoint 4 · Prove it was you',
        body: [
          'Anyone can copy a transaction id from a block explorer. Nobody can forge a memo. Every shielded output carries 512 encrypted bytes only the recipient can read, and only the person who BUILT the transaction can write. So your final step is a payment to the challenge address with your builder ID in the memo. When our wallet decrypts it, that is cryptographic proof the transaction was yours.',
          'Connect your run in the panel below first, and it shows this exact command with your personal memo filled in. The placeholder version:',
          {
            cmd: '$DT wallet -w ~/zec-wallet send -i ~/zec-wallet/identity.txt --address <challenge address, shown below> --value 1000000 --memo "srz1:<your builder id>"',
            expect: 'Your machine builds a real zero-knowledge proof, broadcasts, and prints the transaction id. Expect it to think for a bit.',
          },
          'Give it a block to confirm, paste the transaction id into the run panel, and the server checks the memo. This is also how real Zcash apps do receipts, invoices, and encrypted messaging, so you have now used the primitive behind half the later challenges.',
        ],
      },
    ],
    steps: [
      {
        id: 'wallet',
        title: 'Build the devtool and create your wallet',
        detail:
          'Install Rust, build zcash-devtool, and run wallet init as shown in the lesson. When list-addresses prints your Unified Address, this step is done.',
        verification: 'attested',
      },
      {
        id: 'fund',
        title: 'Get testnet ZEC from the faucet',
        detail:
          'Paste your Unified Address into the ecosystem faucet and claim a drip. A modern sender paying a UA puts the money in the newest pool, so when you run sync and then balance, watch your drip appear under Ironwood. The faucet page shows the transaction id of your drip, and that is your evidence here. Testnet coins are worthless, which makes them perfect for breaking things.',
        verification: 'chain',
      },
      {
        id: 'send',
        title: 'Send a shielded payment that proves it was you',
        detail:
          'Send 0.01 TAZ to the challenge address with your builder memo, using the exact command shown below. Wait for your drip to reach ten confirmations first or the send reports insufficient funds. Your machine builds a real zero-knowledge proof, then paste the resulting transaction id. Our wallet decrypts your memo, and that is proof of authorship no explorer copy-paste can fake.',
        verification: 'memo',
      },
    ],
    gotcha: {
      heading: '⚠️ Watch out for transparent leakage',
      body: [
        'Point the tool at your own address and see what it is made of. Run "zcash-devtool inspect <your UA>" and it lists the receivers bundled inside, including a transparent one starting with t. Look that t-address up in a testnet explorer. If anyone ever pays it, every coin it touches is public forever. Now search the explorer for your shielded funds and there is nothing to find.',
        'Every Zcash developer internalizes this early. Privacy is a property of the pool the money sits in, and touching the transparent pool leaks metadata even if you shield afterwards. A rule of thumb when you build apps. Keep funds shielded end-to-end, and treat every transparent hop as a disclosure event.',
      ],
    },
  },
  {
    slug: 'watch-the-chain',
    number: 1,
    difficulty: 'intro',
    estMinutes: 40,
    emoji: '🔭',
    title: 'Watch the Chain',
    tagline:
      'No code yet, just learn to see. Follow your own transaction through an explorer and discover what the network knows, and what it provably cannot.',
    status: 'live',
    level: 'foundations',
    skills: ['Block explorers', 'Compact blocks', 'Light client trust'],
    codebase: {
      name: 'lightwalletd',
      repo: 'https://github.com/zcash/lightwalletd',
      whatItDoes:
        'The indexer between wallets and the chain. It strips blocks down to "compact blocks" so a light client can sync in seconds instead of days. Every wallet you have used so far talks to one.',
    },
    lesson: [
      {
        heading: 'Everything is on display, so go look',
        body: [
          'In challenge #0 you sent a payment. Where did it actually go? Onto the blockchain, a public list of every transaction, copied to thousands of computers, that anyone can read with a tool called a block explorer. Think of an explorer as the search engine for that list.',
          'This challenge has no code at all. Your job is to become the observer, the person trying to learn things about other people from the chain. It is the fastest way to understand what privacy tech is actually up against, and every good privacy engineer has spent an afternoon doing exactly this.',
        ],
      },
      {
        heading: 'How your wallet reads the chain',
        body: [
          'Your wallet never downloads the whole blockchain, which would take days. Instead it talks to a server called lightwalletd, which serves "compact blocks". Those are stripped-down summaries containing just enough of each shielded output for a wallet to check, using its keys, whether anything inside belongs to it. That checking is called trial decryption. Your wallet literally tries its key on every note that goes by, and almost all of them fail.',
          'This design means the server never learns your balance or your keys. It also means someone has to run these servers, and later in the track that someone will be you.',
          'Compact blocks have a shape, and that shape changes when the protocol does. Ironwood arrived with a new transaction version carrying a whole new bundle of shielded data, so the compact block format grew fields to describe it. A wallet built before that upgrade reads the new blocks, finds no fields it recognizes, and reports a balance of zero without a single error. That is not a hypothetical. It happened to the wallet this site used to ship, and it is why "keep up with consensus" is a wallet requirement and not a nice-to-have.',
        ],
      },
      {
        heading: 'What the chain admits, and what it hides',
        body: [
          'Find your shielded transaction from challenge #0 in the explorer. Here is everything it shows. The transaction exists, roughly when it was mined, and the fee. No sender, no receiver, no amount. Now look at any transparent transaction next to it, with addresses and amounts, all readable, linkable into a graph of who pays whom.',
          'Sit with that contrast for a minute. It is the whole reason this ecosystem exists.',
        ],
      },
    ],
    steps: [
      {
        id: 'find-tx',
        title: 'Find your own transaction',
        detail:
          'Take the txid from your challenge #0 send and look it up in a testnet explorer. Confirm how little it reveals. You get existence, height, and fee, nothing else.',
        verification: 'attested',
      },
      {
        id: 'trace-transparent',
        title: 'Trace a transparent address',
        detail:
          'Pick any t-address from a recent testnet block and follow its history, where its coins came from and where they went. You are building the surveillance graph privacy tech defends against.',
        verification: 'attested',
      },
      {
        id: 'spot-v6',
        title: 'Spot the upgrade in the wild',
        detail:
          'Find a recent transaction in version 6 format and an older one in version 5, and say what the newer one carries that the older does not. The answer is an Ironwood bundle sitting alongside the Orchard one. You have just read a network upgrade off the chain itself.',
        verification: 'attested',
      },
      {
        id: 'match-tip',
        title: 'Watch your wallet sync',
        detail:
          'Open the wallet page, trigger a sync, and match the height it reports against the explorer’s chain tip. That gap is exactly what lightwalletd is serving your wallet, compact block by compact block.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ Hidden is not invisible',
      body: [
        'A shielded transaction hides its contents, not its existence. An observer still learns that someone transacted in the afternoon, paying a standard fee, and if only one person in a village uses Zcash, timing alone identifies them. Privacy loves company. The more shielded activity there is, the less any single transaction says.',
        'Carry this into everything you build. Encryption protects content, and patterns of behavior need protecting too.',
      ],
    },
  },
  {
    slug: 'memo-messenger',
    number: 2,
    difficulty: 'easy',
    estMinutes: 45,
    emoji: '💬',
    title: 'Memo Messenger',
    tagline:
      'Every shielded payment carries a free, encrypted 512-byte note. Use it to turn Zcash into a private messaging layer.',
    status: 'live',
    level: 'foundations',
    skills: ['Encrypted memos', 'Trial decryption', 'Viewing keys'],
    codebase: {
      name: 'librustzcash · zcash_client_backend',
      repo: 'https://github.com/zcash/librustzcash',
      whatItDoes:
        'The Rust engine inside most Zcash wallets. It does chain scanning, trial decryption of incoming notes, and the memo APIs this challenge is built on. WebZjs wraps it for the browser.',
    },
    lesson: [
      {
        heading: 'A letter inside the envelope',
        body: [
          'Every shielded payment can carry a memo, up to 512 bytes of text, encrypted end-to-end, readable only by the receiver. It rides inside the same sealed envelope as the money, so it costs nothing extra and leaks nothing extra.',
          'Half a kilobyte sounds small until you remember what fits in it. An order number, an invoice reference, a thank-you note, a URL, a message. In this challenge you stop thinking of Zcash as only money and start using it as an encrypted messaging layer, one with no accounts, no phone numbers, and no company in the middle.',
        ],
      },
      {
        heading: 'How mail finds you without an address book',
        body: [
          'Here is the puzzle. Memos are encrypted, and the chain does not say who they are for. So how does your wallet find yours? The same trial decryption you met in challenge #1. The wallet tries its key on every new note on the chain, and the ones that decrypt are yours. Delivery without a mail server, and without anyone learning you received something.',
          'The code doing this lives in zcash_client_backend, the scanning engine inside librustzcash. Every wallet you will use in this track, including the one you built in challenge #0, calls into it to read a memo.',
          'Worth knowing before you build on memos. A memo is optional, and an empty one is the normal case rather than an error. People have audited shielded payments, found no memos, and concluded the money could not be verified. Do not design an app that treats a missing memo as a missing payment.',
        ],
      },
      {
        heading: 'From messages to conversations',
        body: [
          'A single memo is a note, and a conversation needs threading. The pattern every memo app uses is to include your own address in the memo (or an agreed reply marker), so the other side knows where to respond. Fees are pennies, since ZIP-317 sets them at roughly 0.0001 ZEC per typical transaction, so a chat costs less than any SMS plan in history.',
        ],
      },
    ],
    steps: [
      {
        id: 'send-memo',
        title: 'Send a payment with a memo',
        detail:
          'Send a small amount to the challenge address with a message in the memo field, using the same wallet and the same --memo flag you met in challenge #0. The memo travels inside the shielded output, encrypted with the note itself.',
        verification: 'chain',
      },
      {
        id: 'receive-memo',
        title: 'Receive and decrypt one',
        detail:
          'Have a memo sent back to your unified address (a friend, or a second wallet you create yourself) and read it from your wallet’s transaction history. Memos live in full transaction data rather than compact blocks, so if your history shows the payment but no text, sync the extra data before assuming the memo is missing. That read was a successful trial decryption.',
        verification: 'attested',
      },
      {
        id: 'thread',
        title: 'Hold a two-message conversation',
        detail:
          'Include your reply address inside a memo and get a response to it. You have just designed a messaging protocol on top of a payment rail.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ The envelope hides words, not habits',
      body: [
        'Memo contents are sealed, but a pattern of small transactions between the same anonymity set at the same times every day is still a pattern. And 512 bytes is a hard limit, with no overflow, only truncation by whatever app you build. Design for both.',
      ],
    },
  },
  {
    slug: 'build-a-light-wallet',
    number: 3,
    difficulty: 'medium',
    estMinutes: 150,
    emoji: '👛',
    title: 'Build a Light Wallet',
    tagline:
      'Sync, derive addresses, and spend. Assemble your own wallet on the light client protocol, piece by piece.',
    status: 'live',
    level: 'applied',
    skills: ['Compact blocks', 'ZIP-32 keys', 'Sync UX'],
    codebase: {
      name: 'librustzcash',
      repo: 'https://github.com/zcash/librustzcash',
      whatItDoes:
        'The core library family, covering key derivation (ZIP-32), note management, and transaction building. If a Zcash wallet exists, these crates are almost certainly inside it.',
    },
    lesson: [
      {
        heading: 'A wallet is smaller than you think',
        body: [
          'Strip away the UI and every light wallet is five capabilities. Turn a seed into keys, turn keys into addresses, scan the chain for your notes, show what they add up to, and spend them. You have been using a finished one since challenge #0, and now you assemble your own from the same parts, so the mystery goes away for good.',
          'You will build against WebZjs in the browser, but every function you call is a thin wrapper over librustzcash, the Rust crates that sit inside essentially every Zcash wallet in existence. Learn this API surface once and you can read the source of all of them.',
        ],
      },
      {
        heading: 'One seed, every key',
        body: [
          'Those 24 words from challenge #0 are not "a password to your keys". They ARE every key, present and future. ZIP-32 defines a deterministic tree, running from seed to account keys to address keys, all derived by hashing down well-known paths. Restore the seed anywhere and the same tree grows back, which is why backup is 24 words and not a database export.',
          'This is also why your builder identity works across browsers. It is just one more branch derived from the same seed.',
        ],
      },
      {
        heading: 'Sync is the hard part, so budget for it',
        body: [
          'Deriving keys takes microseconds, but knowing your balance takes scanning. A wallet must trial-decrypt every shielded output since its "birthday", the block height when the seed was created. Scan from the birthday and a new wallet syncs in seconds. Scan from genesis and users watch a spinner for an hour and blame you.',
          'Every wallet UX decision that matters, from progress bars to spendable-vs-pending to "why is my balance zero right after restore", is downstream of this one fact.',
          'Restoring is subtler than syncing, and this is where wallets earn their reputation. Ironwood allows two ways to derive the keys an address was built from, so a wallet restoring a seed it has never seen does not know which was used. The rule is to trial-decrypt both ways until funds show up under one of them, then stop scanning the other. Get this wrong and the wallet reports zero on an account that holds money, which is the worst bug a wallet can have because it looks like a working wallet.',
        ],
      },
    ],
    steps: [
      {
        id: 'derive',
        title: 'Derive the tree yourself',
        detail:
          'From a fresh seed, derive the account key, a unified address, and print the pieces. Confirm the same seed always yields the same addresses, because determinism is the feature.',
        verification: 'attested',
      },
      {
        id: 'sync',
        title: 'Sync from a birthday',
        detail:
          'Wire your wallet to lightwalletd, set the birthday to the seed’s creation height, and sync. Show a real progress indicator, height scanned over chain tip, like the one on this site. Report the balance per pool rather than as one number, because a learner (and a user) needs to see which pool holds what.',
        verification: 'attested',
      },
      {
        id: 'birthday-experiment',
        title: 'Break it with the wrong birthday',
        detail:
          'Restore the same seed three times, once with the right birthday, once far too early, once too late. Time each sync and compare the balances. The too-early restore only wastes minutes. The too-late one reports a wrong balance and no error at all, which is the failure the gotcha below is about.',
        verification: 'attested',
      },
      {
        id: 'spend',
        title: 'Spend from your own build',
        detail:
          'Send a payment to the challenge address from the wallet you assembled, not the one this site ships. Same proof, your code.',
        verification: 'chain',
      },
    ],
    gotcha: {
      heading: '⚠️ The birthday problem',
      body: [
        'Restore a wallet with the wrong birthday and one of two things happens. Set it too early and you scan months of chain for nothing. Set it too late and the wallet silently misses notes, so the balance is simply wrong, with no error anywhere. Store the birthday with the seed, always. Half of all "my funds are gone" reports are this.',
      ],
    },
  },
  {
    slug: 'shielded-storefront',
    number: 4,
    difficulty: 'medium',
    estMinutes: 120,
    emoji: '🛒',
    title: 'Shielded Storefront',
    tagline:
      'Sell digital goods for shielded ZEC. Payment-request QR codes in, automatic delivery out, without ever holding spend keys on the server.',
    status: 'live',
    level: 'applied',
    skills: ['ZIP-321 payment URIs', 'Watch-only wallets', 'Payment detection'],
    codebase: {
      name: 'librustzcash · zip321 & zcash_address',
      repo: 'https://github.com/zcash/librustzcash',
      whatItDoes:
        'The crates behind every "pay me" QR code, encoding payment requests (ZIP-321) and parsing the address types that receive them.',
    },
    lesson: [
      {
        heading: 'Getting paid is a protocol',
        body: [
          '"Send 0.5 TAZ to u1abc… with memo order-42" is a sentence a human can garble. ZIP-321 turns it into a payment URI that a wallet reads from a QR code and prefills perfectly, scheme and address and amount and memo all in one string. You met one already. The donation QR in this site’s footer is a ZIP-321 URI.',
          'In this challenge you build the other side of every payment you have made so far, the merchant. A small storefront that sells digital goods for shielded ZEC and notices, on its own, when it has been paid.',
        ],
      },
      {
        heading: 'The server that cannot be robbed',
        body: [
          'Here is the beautiful part. Your storefront never holds spending keys. It holds a viewing key, the read-only key you will study properly in challenge #5, which lets the server SEE incoming payments without any ability to spend them. A hacker who owns your whole server gets a read-only view of your shop’s income and nothing else.',
          'Compare that with every card processor and custodial gateway, where the server compromise IS the heist. Watch-only payment detection is one of Zcash’s most underrated superpowers.',
        ],
      },
      {
        heading: 'Which payment is which?',
        body: [
          'All incoming payments land shielded and look identical, so how do you match a payment to order #42? The memo is your order ID. The ZIP-321 URI you hand the customer includes memo=order-42, the customer’s wallet sends it back inside the sealed envelope, and your scanner routes the payment to the right order. Private on the outside, structured on the inside.',
          'One thing to get right before you take a single order. A customer paying your unified address now lands the money in the Ironwood pool, so your scanner has to be a version that knows that pool exists. An older one syncs happily, decrypts nothing, and reports no sales while your customers insist they paid. That is the same blindness the earlier challenges warned about, except here it looks like lost revenue.',
        ],
      },
    ],
    steps: [
      {
        id: 'uri',
        title: 'Generate payment requests',
        detail:
          'For each product, produce a ZIP-321 URI and QR with the price and an order-ID memo. Scan it with your wallet and confirm every field prefills.',
        verification: 'attested',
      },
      {
        id: 'detect',
        title: 'Detect payment with a viewing key',
        detail:
          'Prove the idea before you write the scanner. Export your store wallet’s viewing key, load it into a second wallet, and watch that wallet see the order payment and its memo while having no way to spend. That is your whole detection design, running, in two commands. Then build the scanner that does it on the server, with no spend keys anywhere near it.',
        verification: 'attested',
      },
      {
        id: 'fulfill',
        title: 'Complete a real sale',
        detail:
          'Buy something from your own store end-to-end, from request to shielded payment to detection to automatic delivery. The payment transaction is the proof.',
        verification: 'chain',
      },
    ],
    gotcha: {
      heading: '⚠️ When is paid actually paid?',
      body: [
        'A payment seen in the mempool can still vanish, because blocks get reorganized, usually shallowly. Deliver a rare digital good at zero confirmations and a reorg quietly unsells it. Pick a confirmation depth per price point. One block is fine for a sticker, ten for anything you would mind losing. "Paid" is a risk threshold you choose, not an event the chain hands you.',
      ],
    },
  },
  {
    slug: 'viewing-keys-disclosure',
    number: 5,
    difficulty: 'medium',
    estMinutes: 90,
    emoji: '🔍',
    title: 'Viewing Keys & Selective Disclosure',
    tagline:
      'Privacy is a dial, not a switch. Hand an auditor a read-only key to exactly what you choose, and nothing else.',
    status: 'live',
    level: 'protocol',
    skills: ['Incoming viewing keys', 'Full viewing keys', 'Auditability'],
    codebase: {
      name: 'librustzcash · zcash_keys',
      repo: 'https://github.com/zcash/librustzcash',
      whatItDoes:
        'Where the key tree lives, with spending keys at the root, full and incoming viewing keys branching off it, and the unified encodings that bundle them.',
    },
    lesson: [
      {
        heading: 'Privacy with a volume knob',
        body: [
          'Total secrecy is rarely what real life needs. You want your accountant to see your business income, an auditor to verify one specific payment, a donor wall to prove a donation happened, each without handing over control of the money or the rest of your history. On transparent chains you get one setting, where everyone sees everything. Zcash gives you a dial.',
          'The dial is made of keys. Below your spending key sit read-only keys of different strengths, and choosing which one to share, with whom, and scoped to what, is the actual product-design skill this challenge teaches.',
        ],
      },
      {
        heading: 'The key hierarchy, precisely',
        body: [
          'At the root sits the spending key. It can move money, so guard it with your life. Derived from it is the full viewing key (FVK), which sees everything, incoming and outgoing, amounts and memos, but cannot spend a zatoshi. Below that is the incoming viewing key (IVK), which sees only what arrives and nothing about what leaves. Each derivation is one-way, so a viewing key can never climb back up to the spending key.',
          'Unified encodings (UFVK and UIVK) bundle the per-pool variants into one shareable string, the same trick unified addresses pulled in challenge #0. The zcash_keys crate is where all of this lives.',
        ],
      },
      {
        heading: 'Single-payment disclosure',
        body: [
          'Sometimes even an IVK shares too much, when you want to prove ONE payment to ONE party. That is the job of a payment disclosure, a statement anyone can check against the chain saying that a specific transaction paid a specific amount to a specific address. Prove the payment, reveal nothing else.',
          'Now the honest part. No shipped tool can produce one today. The old full-node wallet had an experimental version, and it retired along with that wallet. The replacement is a draft specification that covers only the Sapling pool and has no implementation yet. So the dial has a missing notch. You can share a viewing key, or nothing, and per-payment proof is a known gap. Design with the dial you have, and remember this gap when you reach challenge #9, because filling it is one of the most wanted contributions in the ecosystem.',
        ],
      },
    ],
    steps: [
      {
        id: 'derive-keys',
        title: 'Walk the key tree',
        detail:
          'From your wallet, export the UFVK and the IVK. Confirm the derivation direction runs from spending key to FVK to IVK, and never backwards.',
        verification: 'attested',
      },
      {
        id: 'watch-only',
        title: 'Build the auditor’s view',
        detail:
          'Run list-accounts in your devtool wallet and copy the UFVK it prints. Create a second wallet from it with init-fvk (give it your wallet’s birthday so the sync is quick), sync, and look around. Balances, history, and memos are all there, and there is no way to spend. That is your auditor’s exact experience.',
        verification: 'attested',
      },
      {
        id: 'disclose',
        title: 'Scope a disclosure like a designer',
        detail:
          'Pick one payment your auditor wallet can see. Write down what a per-payment proof of it would reveal, next to what the UFVK you just shared reveals. The distance between those two lists is the gap from the lesson, and it is the design constraint every shielded app lives with today.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ There is no unshare button',
      body: [
        'A viewing key shares the address’s past AND future. Hand your accountant an FVK in March and they can still read December. Revocation does not exist, and the only fix is migrating funds to a fresh account. So scope every disclosure as tightly as the question demands. Prefer an IVK to an FVK, design your apps to make the narrow choice the easy one, and the day per-payment proofs ship, reach for those first.',
      ],
    },
  },
  {
    slug: 'run-the-stack',
    number: 6,
    difficulty: 'hard',
    estMinutes: 180,
    emoji: '🛰️',
    title: 'Run the Stack',
    tagline:
      'Stand up your own node and indexer, query it directly over RPC, and point your wallet at infrastructure you control.',
    status: 'live',
    level: 'protocol',
    skills: ['Zebra node', 'JSON-RPC', 'Self-hosted infra', 'Private lookups'],
    codebase: {
      name: 'Zebra & Zaino',
      repo: 'https://github.com/ZcashFoundation/zebra',
      whatItDoes:
        'Zebra is the Zcash Foundation’s Rust node, an independent consensus implementation. Zaino is the next-generation Rust indexer being built to replace lightwalletd beside it.',
    },
    lesson: [
      {
        heading: 'Time to meet your dependency',
        body: [
          'Since challenge #0, one quiet assumption has held everything up. SOMEONE is running a node and an indexer for your wallet to talk to. You have been borrowing their infrastructure and, with it, extending them a little trust. This challenge ends the borrowing. You stand up the full stack yourself and point your own wallet at it.',
          'It is less work than it sounds, just two programs and a config file, and it changes how you read the whole system. Infrastructure stops being weather and becomes something you can operate, debug, and eventually contribute to.',
        ],
      },
      {
        heading: 'The two layers',
        body: [
          'Zebra is the node. It talks to peers, validates every block against consensus rules, and holds the chain. It is the Zcash Foundation’s from-scratch Rust implementation, deliberately independent, so a bug in one implementation does not take down the network. Run a current release. The network upgraded in July, and a node validating by last year’s rules keeps running and looking healthy while every wallet behind it goes blind to the newest pool.',
          'Above it sits the indexer, lightwalletd today and Zaino as its Rust successor, which digests full blocks into the compact blocks your wallets have been syncing from since challenge #1. The node validates and the indexer serves, and wallets only ever see the second layer.',
        ],
      },
      {
        heading: 'Talk to the node directly',
        body: [
          'Your node is not just a black box feeding the indexer. It has a JSON-RPC interface you can call yourself, and it is the most direct way to inspect the chain with no wallet and no explorer in between. Ask it the current height, pull a block, check a transaction, all straight from a source you trust because you run it.',
          'Zebra guards that interface with a cookie. When zebrad starts it writes a small file holding a username and a password, and every request has to present them. The password rotates on every restart, which is a feature and not an annoyance, because a leaked one stops working the moment you reboot. You read the file, take the password half, and hand both to your request.',
          'One wrinkle to know before you build higher. Whether your indexer can present that cookie depends on which one you run. lightwalletd cannot, so pairing it with Zebra means turning cookie auth off and letting the localhost binding do the guarding instead. Zaino can, if you point it at the cookie file. Security here is layered, and deciding which layer does the work is a real operator decision. You are about to make it deliberately rather than discover it as a mystery 401.',
          'The call itself is a plain HTTP POST with a short JSON body naming the method. curl sends it and jq turns the dense answer into something you can read. Keep the RPC bound to localhost in zebrad.toml so only you, or your own private network over something like Tailscale, can reach it.',
        ],
      },
      {
        heading: 'What the operator sees',
        body: [
          'Now that you ARE the operator, audit yourself. Your indexer never sees keys, balances, or memo contents. It does see connecting IP addresses, when they sync, and which transactions they submit. That is real metadata, which is why privacy-conscious users pick their lightwalletd like they pick a DNS provider, and why wallets reach for Tor. Trust, it turns out, was in the stack all along, and now you know exactly where.',
        ],
      },
    ],
    steps: [
      {
        id: 'node',
        title: 'Run a Zebra testnet node',
        detail:
          'Configure zebrad.toml first. Bind the RPC to localhost, leave cookie auth on (it is the default), and point the data directory at a drive with room. Then start zebrad on testnet and let it validate to the tip, watching the logs while peers connect and blocks verify. A full sync can take days even on good hardware, so let it run and check in.',
        verification: 'attested',
      },
      {
        id: 'query-rpc',
        title: 'Query your node over RPC',
        detail:
          'Read the auth cookie for its password, then curl a getblockchaininfo call to your local zebrad and pipe it through jq. The height it returns is the same tip your wallet syncs to, straight from the source with nothing in between.',
        verification: 'attested',
      },
      {
        id: 'indexer',
        title: 'Serve compact blocks',
        detail:
          'Your indexer choice decides how auth works. With lightwalletd, set enable_cookie_auth = false in zebrad.toml and restart, the trade-off from the lesson, safe while the RPC stays on localhost. With Zaino, leave auth on and point validator_cookie_path at Zebra’s cookie directory instead. Either way, confirm your indexer answers a GetLightdInfo request. You are now the server side of challenge #1.',
        verification: 'attested',
      },
      {
        id: 'point-wallet',
        title: 'Sync your wallet against yourself',
        detail:
          'Point your challenge #3 wallet at your own endpoint and sync to the tip. Every layer between your seed and the chain is now yours.',
        verification: 'attested',
      },
      {
        id: 'private-lookup',
        title: 'Look things up privately',
        detail:
          'Point a block explorer at your own node, or query the transaction over RPC, and search for your challenge #0 payment. Nobody logs the lookup because it never leaves your machine. That is the fix for the metadata leak you found in challenge #1.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ A lying server cannot steal, but it can blind',
      body: [
        'A malicious indexer cannot forge blocks (your wallet checks them against consensus) and cannot take funds. What it CAN do is lie by omission, quietly not serving the blocks that contain your incoming notes, so your balance looks smaller than it is, and profile the IPs that connect. Design wallets to make the endpoint visible and switchable, never a silent default.',
      ],
    },
  },
  {
    slug: 'notes-nullifiers-proofs',
    number: 7,
    difficulty: 'hard',
    estMinutes: 120,
    emoji: '⚙️',
    title: 'Notes, Nullifiers & Proofs',
    tagline:
      'Open the hood at last. See how encrypted notes, nullifiers, and zero-knowledge proofs combine into a shielded spend.',
    status: 'live',
    level: 'protocol',
    skills: ['Note commitments', 'Nullifiers', 'Zero-knowledge proofs'],
    codebase: {
      name: 'orchard & halo2',
      repo: 'https://github.com/zcash/orchard',
      whatItDoes:
        'The shielded protocol itself. The Orchard crate defines notes, commitments, and nullifiers, and Halo 2 is the proving system underneath, with no trusted setup required.',
    },
    lesson: [
      {
        heading: 'The three-object trick',
        body: [
          'You have waited six challenges for the hood to open. The entire shielded pool reduces to three objects. A NOTE is money, made of an amount, an owner, and some randomness. A COMMITMENT is the note’s sealed fingerprint, published to the chain in a giant Merkle tree, and it proves the note exists without describing it. A NULLIFIER is the note’s unique serial number, revealed only at spend time, letting the network reject double-spends without ever learning which commitment just died.',
          'Everything you have done since challenge #0, every balance and every send, was these three objects moving through their lifecycle.',
        ],
      },
      {
        heading: 'What the proof actually proves',
        body: [
          'When your browser spent thirty seconds "building a proof," it was constructing a zero-knowledge argument for exactly four statements. One, a note with this value exists in the commitment tree, and here is a Merkle path to the anchor. Two, I hold its spending key. Three, this nullifier is correctly derived from that note. Four, value in equals value out plus fee. The chain verifies all four while learning none of the witnesses.',
          'That is the whole magic, stated plainly. Not "trust me" but "verify this equation."',
        ],
      },
      {
        heading: 'Halo 2, and the setup nobody has to trust',
        body: [
          'Early Zcash proofs needed a "trusted setup" ceremony, with parameters generated in a ritual where if EVERY participant colluded, fake coins were possible. Orchard’s proving system, Halo 2, eliminated the ceremony entirely, with no sacred parameters and nothing to trust but math. In this challenge you rebuild the data structures in miniature, a toy commitment tree and nullifier set, so the real circuit stops being folklore.',
        ],
      },
      {
        heading: 'Why there is a newer pool than Orchard',
        body: [
          'Now that you know what a commitment is, you can understand why Zcash added a pool after Orchard. Orchard commitments rest on a hardness assumption that a large quantum computer would break, and a broken commitment scheme does not just leak privacy, it lets someone mint coins that never existed. Ironwood answers that by binding every field of the note into the commitment randomness rather than only part of it, which makes the commitment binding even against an adversary who can solve the old problem. If that day ever comes, funds in Ironwood can be recovered rather than counterfeited.',
          'The other half of the change is a lifecycle you can watch. Orchard is now closed to new value. It can still be spent, and money leaving it crosses a turnstile that publicly reveals the amount, which is how the network keeps proving no coins were invented. Sprout was retired the same way years earlier. Pools are versioned software with a beginning and an end, and knowing that is the difference between memorizing today’s Zcash and understanding it.',
        ],
      },
    ],
    steps: [
      {
        id: 'tree',
        title: 'Build a toy commitment tree',
        detail:
          'Implement a small Merkle tree of note commitments (any language). Add notes, compute the root, and produce a membership path, your miniature anchor.',
        verification: 'attested',
      },
      {
        id: 'nullify',
        title: 'Enforce no-double-spend',
        detail:
          'Add a nullifier set on top. Spending a note reveals its serial, respending trips the check, and an observer of your log still cannot match serials to commitments.',
        verification: 'attested',
      },
      {
        id: 'anchor',
        title: 'Find it all in a real transaction',
        detail:
          'Run inspect from challenge #0 on your own raw transaction. It names every part and validates as it goes, so locate the anchor, the nullifiers, and the proof, and say what each one is doing. Then inspect a version 6 transaction and find the Ironwood bundle sitting parallel to the Orchard one.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ Deterministic yet unlinkable',
      body: [
        'The nullifier must be DETERMINISTIC, so the same note gives the same serial or double-spends slip through, yet UNLINKABLE to the note’s public commitment, or the whole privacy model collapses the moment you spend. One value, two opposing requirements. The resolution, deriving it from the note plus a secret key inside the proof, is the cleverest move in the protocol. When you can explain it to someone else, you understand shielded Zcash.',
      ],
    },
  },
  {
    slug: 'ship-your-privacy-app',
    number: 8,
    difficulty: 'hard',
    estMinutes: 240,
    emoji: '🚀',
    title: 'Ship Your Privacy App',
    tagline:
      'Design, build, and ship your own shielded app. Everything before this was practice for it.',
    status: 'live',
    level: 'capstone',
    skills: ['Product design', 'WebZjs integration', 'Ecosystem grants'],
    codebase: {
      name: 'Scaffold-ZEC',
      repo: 'https://github.com/jinolabs-xyz/speedrun-zcash',
      whatItDoes:
        'The starter kit this whole site runs on, Next.js wired to the WebZjs wallet. Fork it, strip it down, and build your idea on top.',
    },
    lesson: [
      {
        heading: 'No more prompts',
        body: [
          'Eight challenges taught you the pieces, from wallets and memos to payment detection, viewing keys, infrastructure, and the protocol itself. This one hands you a blank page. Build something YOU want to exist, like private payroll, anonymous donations with public proof-of-receipt, shielded subscriptions, a paid API with memo-authenticated access, or a tip jar for your favorite band.',
          'The strongest capstones are small and finished, not large and almost. One shielded flow, done end-to-end, deployed where a stranger can use it, beats any half-built platform.',
        ],
      },
      {
        heading: 'Design the money flow first',
        body: [
          'Before any code, draw where value moves, and mark every point where it would touch the transparent pool or leak metadata. Who pays whom? What does each party get to see, and is that a viewing key, a disclosure, or nothing? You now have a full toolbox of privacy shapes from challenges #4 and #5, and choosing among them IS the design work.',
          'Mark the pools on that diagram too. Money arriving at a unified address lands in Ironwood, and if your design ever moves funds out of the older Orchard pool, that crossing publishes the amount. So a flow can be perfectly shielded end to end and still have one step where a number becomes public. Better to find that on paper than in an explorer after launch.',
          'Then fork Scaffold-ZEC and strip it. The wallet provider, the components, and the proxy setup stay, and the curriculum goes. What remains is a working shielded-app skeleton you already understand line by line.',
        ],
      },
      {
        heading: 'Shipping is a skill, so practice all of it',
        body: [
          'Deploy it. Write the README you wish every project had, covering what it does, the privacy model in one paragraph, and how to run it. Make that paragraph name the pools your funds pass through, where change lands, and any point where an amount becomes public. A reviewer can check that claim against your app’s own transactions, which is what makes it worth writing. Record a ninety-second demo. This artifact is your proof-of-work for grants, collaborators, and employers in this ecosystem, so polish the outside like you engineered the inside.',
        ],
      },
    ],
    steps: [
      {
        id: 'proposal',
        title: 'Write the one-pager',
        detail:
          'The idea, the users, and the money-flow diagram with its privacy annotations. If the flow does not work on paper, it will not work in code.',
        verification: 'attested',
      },
      {
        id: 'build',
        title: 'Build and deploy',
        detail:
          'Fork the scaffold, build your flow, deploy to a public URL on testnet. Small and finished.',
        verification: 'attested',
      },
      {
        id: 'demo-payment',
        title: 'Prove it with a payment',
        detail:
          'Run one real shielded payment through your deployed app. The transaction is your demo.',
        verification: 'chain',
      },
    ],
    gotcha: {
      heading: '⚠️ The transparent touchpoint you forgot',
      body: [
        'Almost every capstone leaks in the same place, whether an exchange withdrawal, a faucet top-up, or a "just for testing" t-address, some edge where value enters transparently and ties a real identity to a shielded flow. Audit your own app the way you audited strangers in challenge #1, as the adversary, with an explorer open. Find your leak before your users do.',
      ],
    },
  },
  {
    slug: 'first-upstream-contribution',
    number: 9,
    difficulty: 'hard',
    estMinutes: 180,
    emoji: '🤝',
    title: 'Your First Upstream Contribution',
    tagline:
      'You have now used every codebase Zcash runs on. Pick the one that suits you and land a real pull request in it.',
    status: 'live',
    level: 'capstone',
    skills: ['Ecosystem codebases', 'Rust & TypeScript', 'Open-source workflow'],
    codebase: {
      name: 'The whole ecosystem',
      repo: 'https://github.com/zcash',
      whatItDoes:
        'zcash-devtool, WebZjs, librustzcash, Zebra, Zaino, orchard. Every repo you met on the way up is developed in the open and takes contributions. This challenge ends with your name in one of them.',
    },
    lesson: [
      {
        heading: 'You already know the map',
        body: [
          'Look back at the codebase spotlights. WebZjs (TypeScript and Rust-WASM, wallets in browsers), librustzcash (Rust, the wallet engine everything embeds), Zebra (Rust, consensus), Zaino (Rust, the next indexer), orchard and halo2 (Rust, the protocol core). You have USED all of them. That is more working context than most first-time contributors ever bring.',
          'Pick by taste, honestly assessed. Strongest in TypeScript and product instincts, go to WebZjs. Want to live where every wallet’s bugs are born and fixed, go to librustzcash. Drawn to systems and networking, go to Zebra or Zaino. Fascinated by challenge #7, go to orchard. There is no wrong door, and they all lead into the same house.',
          'One more door, and it is the widest. zcash-devtool is the tool you have used since challenge #0, and it is built to be extended. Each command is one small module wired into a list, its maintainer demos adding one live and asks people to send those changes back, and because it is a developer tool rather than consensus code, a rough first attempt gets review instead of alarm.',
        ],
      },
      {
        heading: 'How contributions actually land',
        body: [
          'The loop is unglamorous and it works. Read CONTRIBUTING.md, build the project, run its tests. Find a small issue, whether a good-first-issue label, a doc that lied to you, or an error message that confused you during this very track. Comment on the issue FIRST to claim it and confirm the approach, because maintainers hate surprise thousand-line PRs and love a two-sentence plan.',
          'Then the PR, which should be small, tested, one concern, with a message explaining why not what. Review feedback is the product, because every requested change is a senior engineer teaching you the codebase for free.',
        ],
      },
      {
        heading: 'From one PR to a standing in the ecosystem',
        body: [
          'A merged PR is a beginning, not a trophy. The path from here runs through a second PR (twice as easy), the dev forum threads where protocol decisions happen, and Zcash Community Grants when your capstone wants to become a funded project. The ecosystem is small enough that consistent, useful people become known fast, which is precisely the opportunity.',
        ],
      },
    ],
    steps: [
      {
        id: 'claim',
        title: 'Pick a repo and claim an issue',
        detail:
          'Choose your codebase, build it locally, and comment on a small open issue with your plan. Getting a maintainer’s nod before writing code is the professional move. If the blank page is the thing stopping you, take one of these instead. Teach zcash-devtool to read network upgrade activation heights from a config file, which is what it needs for local test networks and which its maintainer has named as wanted. Write the ZecHub page on key derivation and wallet birthdays, which does not exist and which challenge #3 needed. Or build any piece of the per-payment disclosure that challenge #5 showed you is missing.',
        verification: 'attested',
      },
      {
        id: 'pr',
        title: 'Open the pull request',
        detail:
          'Small, tested, single-purpose, well-described. Link the issue. Respond to every piece of review like the free mentorship it is.',
        verification: 'attested',
      },
      {
        id: 'merged',
        title: 'Get it merged',
        detail:
          'Land it. Your name is now in the commit history of the Zcash ecosystem, which was the destination of this entire track.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ Ambition kills first PRs',
      body: [
        'The failure mode is never "too small". It is the drive-by rewrite, an unrequested refactor of code you met yesterday, in a codebase where every line survived a security review you have not read. Fix the typo. Improve the error message. Add the missing test. Trust arrives in small denominations, and maintainers remember the people who understood that.',
      ],
    },
  },
];

export function getChallenge(slug: string): Challenge | undefined {
  return challenges.find((c) => c.slug === slug);
}
