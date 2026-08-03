'use client';

import { Accordion } from '@heroui/react';

const FAQS = [
  {
    id: 'zero-knowledge',
    question: 'I know nothing about Zcash, or crypto. Can I start?',
    answer:
      'Yes, that is exactly who challenge #0 is written for. The early lessons assume zero background and explain everything in plain words. The technical depth arrives gradually, level by level, and nothing is assumed before it has been taught.',
  },
  {
    id: 'zechub',
    question: 'How is this different from ZecHub?',
    answer:
      'ZecHub is the community’s encyclopedia, with guides, a wiki, and ecosystem news, and it is excellent. Speedrun Zcash is the gym, where everything is an interactive challenge against a live shielded wallet, in the spirit of Speedrun Ethereum. When you want to read, go there. When you want to build, come here.',
  },
  {
    id: 'cost',
    question: 'Is it really free?',
    answer:
      'Yes. MIT licensed, no accounts, no paid tier, nothing gated. The challenges, the wallet, and the platform serving them are all in the public repository.',
  },
  {
    id: 'real-money',
    question: 'Do I need real ZEC?',
    answer:
      'No. Everything runs on Zcash testnet, where coins come from a faucet and are deliberately worthless. You can break things freely, which is the point of testnet.',
  },
  {
    id: 'install',
    question: 'What do I need to install?',
    answer:
      'Rust, and only for the first challenge. One command from rustup.rs installs it, then our script builds zcash-devtool, the command line wallet the Zcash core developers use themselves. Several later challenges use a wallet that runs in your browser tab instead, with nothing to install, and the node and indexer challenge is the one that asks for real infrastructure.',
  },
  {
    id: 'keys',
    question: 'Where do my keys live?',
    answer:
      'On your machine, and never anywhere else. The wallet you build in the first challenge keeps its seed encrypted in a directory you own. The browser wallet used by later challenges generates its seed in the page and keeps it in local storage so it survives a refresh, which is exactly why you should never reuse one of these seeds for real funds. Your progress identity is a separate random secret your browser makes the first time you connect, so it is not derived from either wallet.',
  },
  {
    id: 'slow',
    question: 'Why does sending take so long?',
    answer:
      'Because a zero-knowledge proof is genuinely being built on your own machine, not fetched from a server that does it for you. In the browser wallet that means around thirty seconds, since the current build proves on a single thread. A multi-threaded build will cut that down.',
  },
  {
    id: 'progress',
    question: 'How is my progress tracked without an account?',
    answer:
      'Your builder identity is derived from your wallet seed, so restoring the same seed on any machine reproduces the same builder. The server only ever receives a derived pseudonym and a public key, never the seed, and nothing that links to your addresses or balances.',
  },
  {
    id: 'verification',
    question: 'Are completions actually verified?',
    answer:
      'Steps that touch the chain are. You submit a transaction id and the server independently looks it up on lightwalletd. To be honest about the limit, that proves the transaction exists and was mined, not that you were the one who made it, because shielded transactions reveal no parties. Memo-based attribution closes that gap and is the next thing being built.',
  },
  {
    id: 'background',
    question: 'Do I need to know Rust or cryptography?',
    answer:
      'No. If you are comfortable with JavaScript or TypeScript you can finish every challenge. The cryptography is explained as you meet it, and the one challenge that goes under the hood is near the end, once the concepts have had time to land.',
  },
];

export function Faqs() {
  return (
    <section className="wrap section flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">Questions</span>
        <h2 className="display text-[28px]">Before you start</h2>
      </div>

      <Accordion variant="surface">
        {FAQS.map((faq) => (
          <Accordion.Item key={faq.id} id={faq.id}>
            <Accordion.Heading>
              <Accordion.Trigger className="text-[15.5px] font-semibold">
                {faq.question}
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="text-[14.5px] leading-[1.65] muted">
                {faq.answer}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <p className="hint m-0">
        Still stuck? Open an issue on{' '}
        <a
          href="https://github.com/jinolabs-xyz/speedrun-zcash/issues"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent)' }}
        >
          GitHub
        </a>
        .
      </p>
    </section>
  );
}
