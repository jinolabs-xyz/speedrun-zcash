'use client';

import { useEffect, useState } from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { onConsentChange, readConsent } from '../lib/consent';

/**
 * Mounts analytics only once the visitor has said yes on the consent
 * banner. No consent, no script — not loaded-but-idle, simply absent.
 */
export function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent()?.analytics === true);
    return onConsentChange((consent) => setAllowed(consent.analytics));
  }, []);

  if (!allowed) return null;

  return <VercelAnalytics />;
}
