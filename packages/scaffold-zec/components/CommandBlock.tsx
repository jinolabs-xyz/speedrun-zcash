'use client';

import { useState } from 'react';
import type { LessonBlock } from '../lib/challenges';

/**
 * A copyable command in a lesson, Speedrun Ethereum style: the learner
 * should never have to fish a command out of a prose sentence. `expect`
 * tells them what success looks like before they run it.
 */
export function CommandBlock({ cmd, expect }: Exclude<LessonBlock, string>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the text is still selectable */
    }
  };

  return (
    <div
      className="flex flex-col gap-1 rounded-xl p-3"
      style={{ border: '1px solid var(--hairline)', background: 'rgba(255,255,255,.02)' }}
    >
      <div className="flex items-start gap-3">
        <pre className="m-0 min-w-0 flex-1 overflow-x-auto">
          <code className="mono text-[13px] leading-[1.6]">{cmd}</code>
        </pre>
        <button
          type="button"
          onClick={copy}
          className="mono shrink-0 cursor-pointer rounded-md px-2 py-1 text-[11px]"
          style={{
            border: '1px solid var(--edge)',
            color: copied ? 'var(--success)' : 'var(--dim)',
            background: 'transparent',
          }}
          aria-label="Copy command"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      {expect && (
        <span className="text-[12.5px] leading-[1.5]" style={{ color: 'var(--dim)' }}>
          {expect}
        </span>
      )}
    </div>
  );
}
