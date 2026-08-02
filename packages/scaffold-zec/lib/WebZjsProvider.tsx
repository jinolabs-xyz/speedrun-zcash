'use client';

/**
 * WebZjsProvider — the core of Scaffold-ZEC.
 *
 * Wraps the WebZjs WASM light client (built from ChainSafe/WebZjs) in a React
 * context: init WASM + thread pool, create/restore an in-browser testnet
 * wallet, periodic sync against a lightwalletd gRPC-web proxy, and shielded
 * sends.
 *
 * ⚠️ Educational starter: the seed phrase is kept in localStorage so the
 * wallet survives refreshes and can sign sends. Fine for TESTNET learning,
 * never do this for mainnet funds.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { get, set } from 'idb-keyval';
import { mnemonicToSeed } from './bip39';

// WebZjs types come from the vendored package, but at runtime the module is
// loaded UNBUNDLED from /public — webpack rewrites wasm-bindgen's worker and
// wasm URL wiring in ways that wedge its async runtime, so it must never
// process this module. loadWebZjs is the only entry point.
import type { WebWallet, WalletSummary } from '@chainsafe/webzjs-wallet';

type WebZjsModule = typeof import('@chainsafe/webzjs-wallet');

let webzjsModule: Promise<WebZjsModule> | null = null;

function loadWebZjs(): Promise<WebZjsModule> {
  webzjsModule ??= (async () => {
    const mod: WebZjsModule = await import(
      // @ts-expect-error -- runtime URL, served from public/; typed via WebZjsModule
      /* webpackIgnore: true */ '/webzjs/webzjs_wallet.js'
    );
    await mod.default('/webzjs/webzjs_wallet_bg.wasm');
    return mod;
  })();
  return webzjsModule;
}

const NETWORK = process.env.NEXT_PUBLIC_ZCASH_NETWORK || 'test';
const LIGHTWALLETD_PROXY =
  process.env.NEXT_PUBLIC_LIGHTWALLETD_PROXY || 'http://localhost:8080';

const IDB_WALLET_KEY = 'scaffold-zec-wallet-db';
const LS_SEED_KEY = 'scaffold-zec-seed'; // testnet only!
const LS_BIRTHDAY_KEY = 'scaffold-zec-birthday';
const SYNC_INTERVAL_MS = 30_000;
const ACCOUNT_HD_INDEX = 0;

export interface AccountBalance {
  sapling: number;
  orchard: number;
  transparent: number;
  pendingChange: number;
  pendingSpendable: number;
}

export interface WebZjsState {
  status: 'idle' | 'initializing' | 'no-account' | 'ready' | 'error';
  error: string | null;
  seedPhrase: string | null;
  accountId: number | null;
  unifiedAddress: string | null;
  transparentAddress: string | null;
  balance: AccountBalance | null;
  chainHeight: bigint | null;
  fullyScannedHeight: bigint | null;
  /** Block the wallet was created at — scanning starts here, not at zero,
   *  so it is the only sensible floor for a sync percentage. */
  birthday: number | null;
  syncing: boolean;
  sending: boolean;
}

export interface TxSummary {
  txid: string;
  direction: 'received' | 'sent' | 'internal';
  valueZats: number;
  blockHeight: number | null;
}

export interface WebZjsApi extends WebZjsState {
  /** Boots the wasm light client. Surfaces that need a wallet call this on
   *  mount; the marketing pages never do, so they stay light. */
  ensureWallet: () => void;
  createWallet: () => Promise<string>;
  restoreWallet: (seedPhrase: string, birthday?: number) => Promise<void>;
  triggerSync: () => Promise<void>;
  send: (toAddress: string, amountZats: bigint) => Promise<void>;
  listTransactions: () => Promise<TxSummary[]>;
  network: string;
}

const DIRECTIONS: Record<number, TxSummary['direction']> = {
  0: 'received',
  1: 'sent',
  2: 'internal',
};

const Ctx = createContext<WebZjsApi | null>(null);

export function useWebZjs(): WebZjsApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWebZjs must be used inside <WebZjsProvider>');
  return ctx;
}

export function WebZjsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WebZjsState>({
    status: 'idle',
    error: null,
    seedPhrase: null,
    accountId: null,
    unifiedAddress: null,
    transparentAddress: null,
    balance: null,
    chainHeight: null,
    fullyScannedHeight: null,
    birthday: null,
    syncing: false,
    sending: false,
  });
  const walletRef = useRef<WebWallet | null>(null);
  const initRef = useRef(false);
  const syncingRef = useRef(false);
  const chainHeightRef = useRef<bigint | null>(null);

  const patch = (p: Partial<WebZjsState>) =>
    setState((s) => ({ ...s, ...p }));

  const refreshFromWallet = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;
    const summary: WalletSummary | undefined = await wallet.get_wallet_summary();
    if (summary && summary.account_balances.length > 0) {
      const [accountId, b] = summary.account_balances[0];
      patch({
        accountId,
        fullyScannedHeight:
          summary.fully_scanned_height != null
            ? BigInt(summary.fully_scanned_height)
            : null,
        balance: {
          sapling: b.sapling_balance ?? 0,
          orchard: b.orchard_balance ?? 0,
          transparent: b.unshielded_balance ?? 0,
          pendingChange: b.pending_change ?? 0,
          pendingSpendable: b.pending_spendable ?? 0,
        },
      });
      const [ua, ta] = await Promise.all([
        wallet.get_current_address(accountId),
        wallet.get_current_address_transparent(accountId),
      ]);
      patch({ unifiedAddress: ua, transparentAddress: ta });
    }
    try {
      const height = await wallet.get_latest_block();
      if (height) {
        chainHeightRef.current = height;
        patch({ chainHeight: height });
      }
    } catch {
      /* chain height is best-effort; retried on next sync */
    }
  }, []);

  const persistDb = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;
    const bytes = await wallet.db_to_bytes();
    await set(IDB_WALLET_KEY, bytes);
  }, []);

  const ensureWallet = useCallback(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      patch({ status: 'initializing' });
      try {
        const walletMod = await loadWebZjs();
        // initThreadPool is deliberately not called: the vendor build ships
        // without shared wasm memory, and a failed pool startup leaves rayon
        // wedged. Single-threaded until the parallel build is fixed — see
        // info/HANDOFF.md.

        const savedDb = await get(IDB_WALLET_KEY);
        const wallet = new walletMod.WebWallet(
          NETWORK,
          LIGHTWALLETD_PROXY,
          1,
          1,
          savedDb ?? null,
        );
        walletRef.current = wallet;

        const seed = localStorage.getItem(LS_SEED_KEY);
        const storedBirthday = localStorage.getItem(LS_BIRTHDAY_KEY);
        patch({
          seedPhrase: seed,
          birthday: storedBirthday ? Number(storedBirthday) : null,
        });

        await refreshFromWallet();
        const summary = await wallet.get_wallet_summary();
        const hasAccount = !!summary && summary.account_balances.length > 0;
        patch({ status: hasAccount && seed ? 'ready' : 'no-account' });
      } catch (err) {
        console.error('WebZjs init failed:', err);
        patch({ status: 'error', error: String(err) });
      }
    })();
  }, [refreshFromWallet]);

  const addAccount = useCallback(
    async (seedPhrase: string, birthday: number) => {
      const wallet = walletRef.current;
      if (!wallet) throw new Error('Wallet not initialized');
      await wallet.create_account(
        'default',
        seedPhrase,
        ACCOUNT_HD_INDEX,
        birthday,
      );
      localStorage.setItem(LS_SEED_KEY, seedPhrase);
      localStorage.setItem(LS_BIRTHDAY_KEY, String(birthday));
      patch({ birthday });
      patch({ seedPhrase });
      await persistDb();
      await refreshFromWallet();
      patch({ status: 'ready' });
    },
    [persistDb, refreshFromWallet],
  );

  const createWallet = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) throw new Error('Wallet not initialized');
    const { generate_seed_phrase } = await loadWebZjs();
    const seedPhrase = generate_seed_phrase();
    // New wallet: birthday = current chain tip (nothing older to scan)
    const height = Number(
      chainHeightRef.current ?? (await wallet.get_latest_block()),
    );
    await addAccount(seedPhrase, height);
    return seedPhrase;
  }, [addAccount]);

  const restoreWallet = useCallback(
    async (seedPhrase: string, birthday?: number) => {
      const wallet = walletRef.current;
      if (!wallet) throw new Error('Wallet not initialized');
      const tip = Number(await wallet.get_latest_block());
      await addAccount(seedPhrase.trim(), birthday ?? tip);
    },
    [addAccount],
  );

  const triggerSync = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet || syncingRef.current) return;
    syncingRef.current = true;
    patch({ syncing: true });
    try {
      await wallet.sync();
      await refreshFromWallet();
      await persistDb();
    } catch (err) {
      console.warn('Sync failed (will retry):', err);
    } finally {
      syncingRef.current = false;
      patch({ syncing: false });
    }
  }, [persistDb, refreshFromWallet]);

  // Periodic background sync once an account exists
  useEffect(() => {
    if (state.status !== 'ready') return;
    triggerSync();
    const t = setInterval(triggerSync, SYNC_INTERVAL_MS);
    return () => clearInterval(t);
  }, [state.status, triggerSync]);

  // The wasm build exposes the PCZT flow rather than a one-shot transfer:
  // create → sign (needs the spending key, derived from the seed) → prove →
  // send. Proving runs in the browser and takes a few seconds.
  const send = useCallback(
    async (toAddress: string, amountZats: bigint) => {
      const wallet = walletRef.current;
      const mnemonic = localStorage.getItem(LS_SEED_KEY);
      if (!wallet || state.accountId === null || !mnemonic)
        throw new Error('Wallet not ready');
      patch({ sending: true });
      try {
        const { pczt_sign, SeedFingerprint, UnifiedSpendingKey } =
          await loadWebZjs();
        const seed = await mnemonicToSeed(mnemonic);
        const usk = new UnifiedSpendingKey(NETWORK, seed, ACCOUNT_HD_INDEX);
        const seedFp = new SeedFingerprint(seed);

        let pczt = await wallet.pczt_create(
          state.accountId,
          toAddress,
          amountZats,
        );
        pczt = await pczt_sign(NETWORK, pczt, usk, seedFp);
        pczt = await wallet.pczt_prove(
          pczt,
          usk.to_sapling_proof_generation_key(),
        );
        await wallet.pczt_send(pczt);

        await refreshFromWallet();
        await persistDb();
      } finally {
        patch({ sending: false });
      }
    },
    [state.accountId, persistDb, refreshFromWallet],
  );

  // Transaction history is how a builder produces evidence for challenge
  // steps: the txid of the faucet payment they received, or of the payment
  // they sent, which the server then confirms on chain.
  const listTransactions = useCallback(async (): Promise<TxSummary[]> => {
    const wallet = walletRef.current;
    if (!wallet || state.accountId === null) return [];
    const history = await wallet.get_transaction_history(state.accountId, 25);
    const entries = (history.transactions ?? []) as Array<{
      txid: string;
      tx_type: number;
      value: bigint | number;
      block_height?: number;
    }>;
    return entries.map((tx) => ({
      txid: tx.txid,
      direction: DIRECTIONS[tx.tx_type] ?? 'internal',
      valueZats: Number(tx.value),
      blockHeight: tx.block_height ?? null,
    }));
  }, [state.accountId]);

  const api: WebZjsApi = {
    ...state,
    ensureWallet,
    createWallet,
    restoreWallet,
    triggerSync,
    send,
    listTransactions,
    network: NETWORK,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
