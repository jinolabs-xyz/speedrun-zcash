'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useMotionValueEvent,
  type Variants,
} from 'framer-motion';
import { cn } from '../lib/utils';

const MotionLink = motion.create(Link);

const NAV_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'Challenges', href: '/challenges' },
  { name: 'Wallet', href: '/wallet' },
  {
    name: 'GitHub ↗',
    href: 'https://github.com/Giri-Aayush/speedrun-zcash',
    external: true,
  },
];

const EXPAND_SCROLL_THRESHOLD = 80;

/* Wide enough for the collapsed "Speedrun Zcash" wordmark. */
const COLLAPSED_WIDTH = '10.5rem';

const containerVariants: Variants = {
  expanded: {
    y: 0,
    opacity: 1,
    width: 'auto',
    transition: {
      y: { type: 'spring', damping: 18, stiffness: 250 },
      opacity: { duration: 0.3 },
      type: 'spring',
      damping: 20,
      stiffness: 300,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  collapsed: {
    y: 0,
    opacity: 1,
    width: COLLAPSED_WIDTH,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
      when: 'afterChildren',
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const logoVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: { type: 'spring', damping: 15 },
  },
  collapsed: { opacity: 0, x: -25, rotate: -180, transition: { duration: 0.3 } },
};

const itemVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', damping: 15 },
  },
  collapsed: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

const wordmarkVariants: Variants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 15, stiffness: 300, delay: 0.15 },
  },
};

/**
 * Floating pill navigation. Scrolling down folds it into the "Speedrun
 * Zcash" wordmark; scrolling back up (or clicking the pill) unfolds the
 * links.
 * The pill carries the hero's gold radial glow as its background so it
 * reads as a piece of the hero even after you've scrolled past it.
 */
export function AnimatedNav() {
  const [isExpanded, setExpanded] = React.useState(true);

  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);
  const scrollPositionOnCollapse = React.useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = lastScrollY.current;

    if (isExpanded && latest > previous && latest > 150) {
      setExpanded(false);
      scrollPositionOnCollapse.current = latest;
    } else if (
      !isExpanded &&
      latest < previous &&
      scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD
    ) {
      setExpanded(true);
    }

    lastScrollY.current = latest;
  });

  const handleNavClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      setExpanded(true);
    }
  };

  return (
    <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        variants={containerVariants}
        whileHover={!isExpanded ? { scale: 1.1 } : {}}
        whileTap={!isExpanded ? { scale: 0.95 } : {}}
        onClick={handleNavClick}
        className={cn(
          'relative flex h-12 items-center overflow-hidden rounded-full backdrop-blur-md',
          !isExpanded && 'cursor-pointer justify-center',
        )}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.16)',
          backgroundColor: 'rgba(18, 18, 22, 0.9)',
          // A gold wash on top of the solid fill, plus a lift shadow and a
          // faint inner top highlight so the pill reads as a raised chip
          // against the dark warp rather than dissolving into it.
          backgroundImage:
            'radial-gradient(120% 90% at 50% 45%, rgba(244, 183, 40, 0.16), transparent 68%)',
          boxShadow:
            '0 10px 34px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        <motion.div
          variants={logoVariants}
          className="flex shrink-0 items-center pl-4 pr-1 text-[15px]"
          aria-hidden="true"
        >
          🏃
        </motion.div>

        <motion.div
          className={cn(
            'flex items-center gap-1 pr-4 sm:gap-2',
            // Links must not swallow the click that re-expands the pill.
            !isExpanded && 'pointer-events-none',
          )}
        >
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <motion.a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                variants={itemVariants}
                onClick={(e) => e.stopPropagation()}
                className="whitespace-nowrap px-2 py-1 text-[13.5px] font-medium muted transition-colors hover:text-[var(--gold)]"
              >
                {item.name}
              </motion.a>
            ) : (
              <MotionLink
                key={item.name}
                href={item.href}
                variants={itemVariants}
                onClick={(e) => e.stopPropagation()}
                className="whitespace-nowrap px-2 py-1 text-[13.5px] font-medium muted transition-colors hover:text-[var(--gold)]"
              >
                {item.name}
              </MotionLink>
            ),
          )}
        </motion.div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            variants={wordmarkVariants}
            animate={isExpanded ? 'expanded' : 'collapsed'}
            className="whitespace-nowrap text-[13px] font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Speedrun <span style={{ color: 'var(--gold)' }}>Zcash</span>
          </motion.div>
        </div>
      </motion.nav>
    </div>
  );
}
