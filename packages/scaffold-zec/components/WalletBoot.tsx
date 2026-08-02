'use client';

import { useEffect } from 'react';
import { useWebZjs } from '../lib/WebZjsProvider';

/** Starts the wasm light client on surfaces that actually need a wallet. */
export function WalletBoot() {
  const { ensureWallet } = useWebZjs();
  useEffect(ensureWallet, [ensureWallet]);
  return null;
}
