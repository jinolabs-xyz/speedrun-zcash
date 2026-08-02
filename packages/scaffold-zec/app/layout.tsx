import type { Metadata } from 'next';
import './globals.css';
import { display, sans, mono } from './fonts';
import { Providers } from '../components/Providers';
import { Footer } from '../components/Footer';
import { CookieConsent } from '../components/CookieConsent';
import { Analytics } from '../components/Analytics';
import { AnimatedNav } from '../components/AnimatedNav';
import { CornerStatus } from '../components/CornerStatus';

export const metadata: Metadata = {
  title: 'Speedrun Zcash',
  description:
    'An interactive journey into the Zcash ecosystem. Start with zero crypto knowledge and finish contributing to the codebases Zcash runs on, through hands-on challenges with a real shielded wallet in your browser.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}
      data-theme="dark"
    >
      {/* Browser extensions (ColorZilla, Grammarly, and friends) inject
          attributes onto <body> before React hydrates, which trips a
          hydration warning that has nothing to do with our markup. Suppress
          it one level deep; real mismatches inside the tree still surface. */}
      <body suppressHydrationWarning>
        <Providers>
          {/* Floating pill nav — fixed, so it takes no flow space. Pages
              begin with generous top padding (.section, hero pt-28), which
              is what keeps content clear of it. */}
          <AnimatedNav />
          <CornerStatus />
          <div className="h-6" aria-hidden="true" />

          {children}

          <Footer />
          <CookieConsent />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
