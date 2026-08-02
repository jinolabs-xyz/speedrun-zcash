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
   */
  verification: 'attested' | 'chain';
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

export interface Challenge {
  slug: string;
  number: number;
  emoji: string;
  title: string;
  tagline: string;
  status: 'live' | 'soon';
  level: Level;
  skills: string[];
  /**
   * The real ecosystem codebase this challenge introduces. Ten challenges,
   * ten spotlights, so by the end the learner has met every library that
   * matters and knows what each one is for.
   */
  codebase: { name: string; repo: string; whatItDoes: string };
  /** Lesson sections rendered before the interactive part */
  lesson: { heading: string; body: string[] }[];
  steps: ChallengeStep[];
  gotcha?: { heading: string; body: string[] };
}

export const challenges: Challenge[] = [
  {
    slug: 'first-shielded-transaction',
    number: 0,
    emoji: '🏁',
    title: 'First Shielded Transaction',
    tagline:
      'Create an in-browser wallet, fund it from the faucet, and send a payment nobody can see.',
    status: 'live',
    level: 'foundations',
    skills: ['Shielded pools', 'Unified addresses', 'Testnet', 'Light clients'],
    codebase: {
      name: 'WebZjs',
      repo: 'https://github.com/ChainSafe/WebZjs',
      whatItDoes:
        'Zcash light-client code compiled to WebAssembly. It is the wallet running in your browser tab right now, built by ChainSafe on top of the same Rust libraries the desktop and mobile wallets use.',
    },
    lesson: [
      {
        heading: 'Money that keeps secrets',
        body: [
          'Picture this. Every time you pay for anything, you write the amount, your name, and who you paid on a postcard, then mail it for the whole world to read, forever. That is how most blockchains work. Bitcoin is a public postcard system.',
          'Zcash is money in a sealed envelope. The network can check the envelope is legitimate, that the money is real and nobody is spending the same coin twice, without ever opening it. The trick that makes this possible is called a zero-knowledge proof, a way to prove something is true without revealing why. You are about to use one for real.',
          'In this challenge you run the loop every Zcash app is built on. Create a wallet in your browser, receive some coins, and send a payment nobody can see. The coins are testnet, play money that is deliberately worthless, so nothing can go wrong that matters. No installs, no crypto background required.',
        ],
      },
      {
        heading: 'Postcards versus envelopes',
        body: [
          'Zcash is one chain, but money on it lives in different "pools". The transparent pool is the postcard system. Addresses start with t, and anyone can look up every transaction. It exists for compatibility with the Bitcoin-style world.',
          'The shielded pools (an older one called Sapling and the current one, Orchard) are the sealed envelopes, where sender, receiver, and amount are all encrypted. A shielded balance is a set of encrypted "notes" that only your keys can read. When you spend one, the network checks a zero-knowledge proof that the money exists and is yours, and learns nothing else.',
        ],
      },
      {
        heading: 'Unified addresses',
        body: [
          'Modern Zcash wallets share one Unified Address (UA) that bundles receivers for multiple pools. Payments to a UA land shielded whenever the sender supports it. Your wallet below shows both your UA and a transparent address. Compare what a block explorer can see about each after you transact.',
        ],
      },
    ],
    steps: [
      {
        id: 'wallet',
        title: 'Create your wallet',
        detail:
          'Generate a 24-word seed in the browser. The seed is the wallet, and everything else is derived from it.',
        verification: 'attested',
      },
      {
        id: 'fund',
        title: 'Get testnet ZEC from the faucet',
        detail:
          'Copy your unified address and request TAZ from a testnet faucet, then wait for the wallet to sync it. Testnet coins are worthless, which makes them perfect for breaking things.',
        verification: 'chain',
      },
      {
        id: 'send',
        title: 'Send a shielded payment',
        detail:
          'Send some TAZ to any address, and the challenge address works fine. Your browser builds a real zero-knowledge proof, so expect it to take a few seconds.',
        verification: 'chain',
      },
    ],
    gotcha: {
      heading: '⚠️ Watch out for transparent leakage',
      body: [
        'Look up your transparent address in a testnet explorer and every coin it ever touches is public. Now look up your unified address and there is nothing to find. Every Zcash developer internalizes this early. Privacy is a property of the pool the money sits in, and touching the transparent pool leaks metadata even if you shield afterwards.',
        'A rule of thumb when you build apps. Keep funds shielded end-to-end, and treat every transparent hop as a disclosure event.',
      ],
    },
  },
  {
    slug: 'watch-the-chain',
    number: 1,
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
          'Your browser wallet never downloads the whole blockchain, which would take days. Instead it talks to a server called lightwalletd, which serves "compact blocks". Those are stripped-down summaries containing just enough of each shielded output for a wallet to check, using its keys, whether anything inside belongs to it. That checking is called trial decryption. Your wallet literally tries its key on every note that goes by, and almost all of them fail.',
          'This design means the server never learns your balance or your keys. It also means someone has to run these servers, and later in the track that someone will be you.',
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
          'The code doing this lives in zcash_client_backend, the scanning engine inside librustzcash. When you call the WebZjs API to read a memo, that is the machinery underneath.',
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
          'Send a small amount to the challenge address with a message in the memo field. The memo travels inside the shielded output, encrypted with the note itself.',
        verification: 'chain',
      },
      {
        id: 'receive-memo',
        title: 'Receive and decrypt one',
        detail:
          'Have a memo sent back to your unified address (a friend, a second wallet, or the faucet bot) and read it from your wallet’s transaction history. That read was a successful trial decryption.',
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
          'Wire your wallet to lightwalletd, set the birthday to the seed’s creation height, and sync. Show a real progress indicator, height scanned over chain tip, like the one on this site.',
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
          'Run a watch-only scanner on the store’s viewing key that spots the incoming payment and matches the memo to the open order. No spend keys anywhere near the server.',
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
          'Sometimes even an IVK shares too much, when you want to prove ONE payment to ONE party. Payment disclosures do exactly that. They are a signed statement, verifiable against the chain, that a specific transaction paid a specific amount to a specific address. This is the dispute-resolution tool for shielded commerce. Prove the payment, reveal nothing else, case closed.',
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
          'Restore a second wallet from the viewing key alone. Watch it find every transaction, with balances, memos, and history, while the send button stays impossible. That is your auditor’s exact experience.',
        verification: 'attested',
      },
      {
        id: 'disclose',
        title: 'Disclose a single payment',
        detail:
          'Produce a disclosure for one transaction and verify it as a third party would, with the payment proven and everything else still sealed.',
        verification: 'attested',
      },
    ],
    gotcha: {
      heading: '⚠️ There is no unshare button',
      body: [
        'A viewing key shares the address’s past AND future. Hand your accountant an FVK in March and they can still read December. Revocation does not exist, and the only fix is migrating funds to a fresh account. So scope every disclosure as tightly as the question demands. Reach for per-payment proof before an IVK, and an IVK before an FVK, and design your apps to make the narrow choice the easy one.',
      ],
    },
  },
  {
    slug: 'run-the-stack',
    number: 6,
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
          'Zebra is the node. It talks to peers, validates every block against consensus rules, and holds the chain. It is the Zcash Foundation’s from-scratch Rust implementation, deliberately independent, so a bug in one implementation does not take down the network.',
          'Above it sits the indexer, lightwalletd today and Zaino as its Rust successor, which digests full blocks into the compact blocks your wallets have been syncing from since challenge #1. The node validates and the indexer serves, and wallets only ever see the second layer.',
        ],
      },
      {
        heading: 'Talk to the node directly',
        body: [
          'Your node is not just a black box feeding the indexer. It has a JSON-RPC interface you can call yourself, and it is the most direct way to inspect the chain with no wallet and no explorer in between. Ask it the current height, pull a block, check a transaction, all straight from a source you trust because you run it.',
          'Zebra guards that interface with a cookie. When zebrad starts it writes a small file holding a username and a password, and every request has to present them. The password rotates on every restart, which is a feature and not an annoyance, because a leaked one stops working the moment you reboot. You read the file, take the password half, and hand both to your request.',
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
          'Configure zebrad.toml first. Bind the RPC to localhost, turn on the auth cookie, and point the data directory at a drive with room. Then start zebrad on testnet and let it validate to the tip, watching the logs while peers connect and blocks verify.',
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
          'Run lightwalletd (or Zaino) against your node and confirm it answers a GetLightdInfo request. You are now the server side of challenge #1.',
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
          'Take your challenge #0 transaction apart with an explorer or the orchard crate docs. Locate the anchor, the nullifiers, and the proof, and say what each one is doing.',
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
    emoji: '🚀',
    title: 'Ship Your Privacy App',
    tagline:
      'Design, build, and ship your own shielded app. Everything before this was practice for it.',
    status: 'live',
    level: 'capstone',
    skills: ['Product design', 'WebZjs integration', 'Ecosystem grants'],
    codebase: {
      name: 'Scaffold-ZEC',
      repo: 'https://github.com/Giri-Aayush/speedrun-zcash',
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
          'Then fork Scaffold-ZEC and strip it. The wallet provider, the components, and the proxy setup stay, and the curriculum goes. What remains is a working shielded-app skeleton you already understand line by line.',
        ],
      },
      {
        heading: 'Shipping is a skill, so practice all of it',
        body: [
          'Deploy it. Write the README you wish every project had, covering what it does, the privacy model in one paragraph, and how to run it. Record a ninety-second demo. This artifact is your proof-of-work for grants, collaborators, and employers in this ecosystem, so polish the outside like you engineered the inside.',
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
        'WebZjs, librustzcash, Zebra, Zaino, orchard. Every repo you met on the way up is developed in the open and takes contributions. This challenge ends with your name in one of them.',
    },
    lesson: [
      {
        heading: 'You already know the map',
        body: [
          'Look back at the codebase spotlights. WebZjs (TypeScript and Rust-WASM, wallets in browsers), librustzcash (Rust, the wallet engine everything embeds), Zebra (Rust, consensus), Zaino (Rust, the next indexer), orchard and halo2 (Rust, the protocol core). You have USED all of them. That is more working context than most first-time contributors ever bring.',
          'Pick by taste, honestly assessed. Strongest in TypeScript and product instincts, go to WebZjs. Want to live where every wallet’s bugs are born and fixed, go to librustzcash. Drawn to systems and networking, go to Zebra or Zaino. Fascinated by challenge #7, go to orchard. There is no wrong door, and they all lead into the same house.',
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
          'Choose your codebase, build it locally, and comment on a small open issue with your plan. Getting a maintainer’s nod before writing code is the professional move.',
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
