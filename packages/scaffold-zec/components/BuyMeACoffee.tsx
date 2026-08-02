'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
import { DONATION_ADDRESS, DONATION_URI } from '../lib/donation';

function CoffeeMark() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2.5 6h8.5v3.5A3.5 3.5 0 0 1 7.5 13H6a3.5 3.5 0 0 1-3.5-3.5V6Z" />
      <path d="M11 7h.75a1.75 1.75 0 1 1 0 3.5H11" />
      <path d="M5.2 2c-.4.6.4 1.1 0 1.7M8.2 2c-.4.6.4 1.1 0 1.7" />
    </svg>
  );
}

function QrCode() {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Loaded on open rather than with the page: nobody pays for a QR encoder
  // to read the landing page.
  useEffect(() => {
    let active = true;
    import('qrcode')
      .then((qrcode) =>
        qrcode.toDataURL(DONATION_URI, {
          margin: 2,
          width: 340,
          errorCorrectionLevel: 'M',
          color: { dark: '#0a0a0c', light: '#ededf0' },
        }),
      )
      .then((url) => active && setSrc(url))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;

  return (
    <div
      className="flex items-center justify-center rounded-xl p-4"
      style={{
        background: 'var(--field-background)',
        border: '1px solid var(--hairline)',
      }}
    >
      <div
        className="flex h-[164px] w-[164px] items-center justify-center rounded-lg"
        style={{ background: '#ededf0' }}
      >
        {src ? (
          <img
            src={src}
            alt="QR code for the donation address"
            className="h-full w-full rounded-lg"
          />
        ) : (
          <Spinner size="sm" aria-label="Generating QR code" />
        )}
      </div>
    </div>
  );
}

function CopyAddressButton() {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      fullWidth
      variant="primary"
      onPress={async () => {
        try {
          await navigator.clipboard.writeText(DONATION_ADDRESS);
        } catch {
          // The async clipboard API is blocked in some embedded browsers;
          // fall back to the selection-based copy so the button never
          // silently does nothing.
          const ta = document.createElement('textarea');
          ta.value = DONATION_ADDRESS;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? 'Copied' : 'Copy address'}
    </Button>
  );
}

export function BuyMeACoffee() {
  return (
    <Modal>
      <Button variant="secondary" className="rounded-full">
        <CoffeeMark />
        Buy me a coffee
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Icon
                className="rounded-full"
                style={{
                  background: 'var(--field-background)',
                  border: '1px solid var(--hairline)',
                }}
              >
                <CoffeeMark />
              </Modal.Icon>
              <Modal.Heading className="panel-title">
                Support Speedrun Zcash
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-5">
              <p className="m-0 text-[14.5px] leading-[1.6] muted">
                Speedrun Zcash is free and open source. If it taught you
                something, you can support the project with a shielded ZEC
                donation, so the amount and the sender stay private, in keeping
                with what this site teaches.
              </p>

              <QrCode />

              <div className="flex flex-col gap-2">
                <span className="eyebrow">Shielded address · mainnet</span>
                <code
                  className="block rounded-xl p-3 text-[11.5px] leading-[1.6]"
                  style={{
                    background: 'var(--field-background)',
                    border: '1px solid var(--hairline)',
                    wordBreak: 'break-all',
                  }}
                >
                  {DONATION_ADDRESS}
                </code>
              </div>

              <p className="hint m-0">
                This is a mainnet address. Send from an external wallet such
                as Zashi or YWallet. The wallet built into this site is
                testnet-only and cannot pay it.
              </p>
            </Modal.Body>

            <Modal.Footer>
              <CopyAddressButton />
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
