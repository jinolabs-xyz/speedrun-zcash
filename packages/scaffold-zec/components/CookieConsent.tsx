'use client';

import { useEffect, useState } from 'react';
import { Button, Surface, Switch } from '@heroui/react';
import { readConsent, writeConsent } from '../lib/consent';

/**
 * Bottom-corner consent banner. Analytics loads only after a yes — see
 * Analytics.tsx, which subscribes to the same consent state.
 */
export function CookieConsent() {
  // Starts hidden so an already-answered banner never flashes in before
  // localStorage can be read on the client.
  const [state, setState] = useState<'checking' | 'open' | 'answered'>(
    'checking',
  );
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    setState(readConsent() === null ? 'open' : 'answered');
  }, []);

  if (state !== 'open') return null;

  const answer = (consent: { analytics: boolean }) => {
    writeConsent(consent);
    setState('answered');
  };

  return (
    <Surface
      variant="secondary"
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-4 rounded-2xl p-6 shadow-2xl"
      style={{ border: '1px solid var(--hairline)' }}
    >
      <div className="flex flex-col gap-2">
        <span className="panel-title">Can we store cookies?</span>
        <p className="m-0 text-[13.5px] leading-[1.6] muted">
          We sometimes use cookies to understand how the site is used and
          improve it. Choose what you allow.
        </p>
      </div>

      {customizing && (
        <div
          className="flex flex-col gap-3 rounded-xl p-4"
          style={{ border: '1px solid var(--hairline)' }}
        >
          <Switch isSelected isDisabled size="sm">
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Essential, always on
            </Switch.Content>
          </Switch>
          <Switch isSelected={analytics} onChange={setAnalytics} size="sm">
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Analytics, anonymous usage stats
            </Switch.Content>
          </Switch>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {customizing ? (
          <Button
            size="sm"
            variant="primary"
            onPress={() => answer({ analytics })}
          >
            Save choices
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="underline underline-offset-4"
              onPress={() => setCustomizing(true)}
            >
              Customize
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto"
              onPress={() => answer({ analytics: false })}
            >
              No
            </Button>
            <Button
              size="sm"
              variant="primary"
              onPress={() => answer({ analytics: true })}
            >
              Yes
            </Button>
          </>
        )}
      </div>
    </Surface>
  );
}
