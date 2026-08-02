import Link from 'next/link';
import { BuyMeACoffee } from './BuyMeACoffee';

const REPO = 'https://github.com/Giri-Aayush/speedrun-zcash';
const AUTHOR = 'https://github.com/Giri-Aayush';

/** Every destination here is real — no placeholder privacy or terms pages. */
const MAIN_LINKS = [
  { href: '/challenges', label: 'Challenges' },
  { href: '/wallet', label: 'Wallet' },
  { href: `${REPO}#readme`, label: 'Docs', external: true },
  { href: `${REPO}/issues`, label: 'Issues', external: true },
];

const META_LINKS = [
  { href: `${REPO}/blob/master/LICENSE`, label: 'MIT License' },
  { href: 'https://z.cash', label: 'Zcash' },
  { href: 'https://faucet.zecpages.com/', label: 'Testnet faucet' },
];

function GithubMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function ZcashMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 1.6A6.4 6.4 0 1 1 8 14.4 6.4 6.4 0 0 1 8 1.6Zm.75 1.3h-1.5v1.2H4.9v1.4h3.05L4.75 10.3v1.2h2.5v1.2h1.5v-1.2h2.35v-1.4H8.13l3.19-4.8V3.9H8.75V2.9Z" />
    </svg>
  );
}

const SOCIAL = [
  { href: REPO, label: 'GitHub repository', icon: <GithubMark /> },
  { href: 'https://z.cash', label: 'Zcash', icon: <ZcashMark /> },
];

export function Footer() {
  return (
    <footer className="wrap pt-14 pb-10">
      <div className="rule" />

      <div className="flex flex-col gap-8 pt-8 md:flex-row md:items-start md:justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-bold"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          🏃 Speedrun
          <span style={{ color: 'var(--accent)', marginLeft: '-3px' }}>Zcash</span>
        </Link>

        <ul className="m-0 flex list-none items-center gap-3 p-0">
          <li>
            <BuyMeACoffee />
          </li>
          {SOCIAL.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="button button--secondary button--icon-only rounded-full"
              >
                {item.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col items-start gap-1.5">
          <span className="meta">© 2026 Speedrun Zcash · MIT</span>
          <span className="meta">
            Built with <span style={{ color: 'var(--accent)' }}>♥</span> by{' '}
            <a
              href={AUTHOR}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              Aayush Giri
            </a>
          </span>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <nav>
            <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
              {MAIN_LINKS.map((link) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13.5px] muted hover:text-[var(--accent)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] muted hover:text-[var(--accent)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {META_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="meta hover:text-[var(--accent)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
