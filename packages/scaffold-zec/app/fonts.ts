import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from 'next/font/google';

// Self-hosted at build time, which is not optional here: the COEP headers the
// wasm wallet needs would block a cross-origin font request.

export const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

export const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});
