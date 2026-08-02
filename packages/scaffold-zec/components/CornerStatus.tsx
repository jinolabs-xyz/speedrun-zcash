const REPO = 'https://github.com/Giri-Aayush/speedrun-zcash';

/**
 * Site-chrome status, shown as announcement pills (a leading tag chip plus a
 * label) flanking the floating nav. Live sits top-left, the open-source link
 * top-right.
 */
export function CornerStatus() {
  return (
    <>
      <div className="fixed left-6 top-6 z-50 flex h-12 items-center">
        <span
          className="flex items-center gap-2 rounded-full border py-1 pl-[6px] pr-3 backdrop-blur-md"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.16)',
            background: 'rgba(18, 18, 22, 0.9)',
            boxShadow:
              '0 10px 34px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          <span
            className="mono flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.06em]"
            style={{ background: 'rgba(63, 185, 80, 0.14)', color: 'var(--success)' }}
          >
            <span className="dot dot-live" />
            LIVE
          </span>
          <span
            className="mono text-[11px] tracking-[0.12em]"
            style={{ color: 'var(--muted)' }}
          >
            Testnet
          </span>
        </span>
      </div>

      <a
        href={REPO}
        target="_blank"
        rel="noreferrer"
        aria-label="Open source on GitHub"
        className="group fixed right-6 top-6 z-50 flex h-12 items-center"
      >
        <span
          className="flex items-center gap-2 rounded-full border py-1 pl-[6px] pr-3 backdrop-blur-md transition-colors group-hover:border-[var(--gold-edge)]"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.16)',
            background: 'rgba(18, 18, 22, 0.9)',
            boxShadow:
              '0 10px 34px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          <span
            className="mono rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.06em]"
            style={{ background: 'rgba(244, 183, 40, 0.12)', color: 'var(--gold)' }}
          >
            MIT
          </span>
          <span
            className="mono text-[11px] tracking-[0.12em] transition-colors group-hover:text-[var(--gold)]"
            style={{ color: 'var(--muted)' }}
          >
            Open source
          </span>
          <span
            className="text-[11px] transition-colors group-hover:text-[var(--gold)]"
            style={{ color: 'var(--dim)' }}
            aria-hidden="true"
          >
            ↗
          </span>
        </span>
      </a>
    </>
  );
}
