export const ZATS_PER_ZEC = 100_000_000;

export function zecToZats(zec: string | number): bigint {
  const n = typeof zec === 'string' ? Number(zec) : zec;
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ZEC amount: ${zec}`);
  return BigInt(Math.round(n * ZATS_PER_ZEC));
}

export function zatsToZec(zats: number | bigint): string {
  return (Number(zats) / ZATS_PER_ZEC).toFixed(8).replace(/\.?0+$/, '') || '0';
}

export function shortenAddress(addr: string, chars = 10): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
