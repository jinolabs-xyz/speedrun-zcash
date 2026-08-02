'use client';

import { WebZjsProvider } from '../lib/WebZjsProvider';
import { BuilderProvider } from '../lib/BuilderProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WebZjsProvider>
      <BuilderProvider>{children}</BuilderProvider>
    </WebZjsProvider>
  );
}
