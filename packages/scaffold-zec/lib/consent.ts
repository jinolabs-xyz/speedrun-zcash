/**
 * Cookie-consent state, shared between the banner and anything it gates.
 *
 * Stored in localStorage rather than a cookie on purpose: the value has to
 * be readable before any analytics loads, and storing "no cookies please"
 * in a cookie would be a strange way to honor the answer.
 */

export type Consent = {
  /** Whether analytics may load. Essential storage is always allowed. */
  analytics: boolean;
};

const KEY = 'speedrun-cookie-consent';
const EVENT = 'speedrun-consent-change';

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.analytics === 'boolean'
      ? { analytics: parsed.analytics }
      : null;
  } catch {
    return null;
  }
}

export function writeConsent(consent: Consent) {
  localStorage.setItem(KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: consent }));
}

/** Subscribe to consent changes; returns an unsubscribe function. */
export function onConsentChange(fn: (consent: Consent) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<Consent>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
