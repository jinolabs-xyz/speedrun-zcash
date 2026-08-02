'use client';

import { useEffect, useState } from 'react';

/** Live chain tip, read from the server rather than by booting the wallet. */
export function ChainTip() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/chain-tip')
      .then((r) => r.json())
      .then((d) => setHeight(d.height))
      .catch(() => setHeight(null));
  }, []);

  return (
    <div className="meta">
      {height ? `block ${height.toLocaleString()}` : 'Zcash testnet'} · 24-word
      seeds · proofs built in-browser
    </div>
  );
}
