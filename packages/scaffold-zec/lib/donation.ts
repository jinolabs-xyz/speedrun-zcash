/**
 * Donation address for the project.
 *
 * This is a MAINNET unified address (`u1…`), so it takes real ZEC from an
 * external wallet. The wallet embedded in this app is testnet-only and
 * cannot pay it — the modal says so plainly, because a testnet wallet
 * quietly failing against a mainnet address is a miserable way to find out.
 *
 * Being a unified address, funds arrive in a shielded pool: the amount and
 * the sender stay private, which is a fitting way to support a project about
 * exactly that.
 */
export const DONATION_ADDRESS =
  'u10e5x2zjl7tul3a60ur8dglce30uysqfs6txx6ye7k8vr9g0ps4lpr7gkl9xy25atfx483unqrqr8u0tp3mmy6fv726p3kjjx8yqedjks0nyvfu96nmwnq6dvqfler3l35slsrmr6lxwt6x8kyvajzc3mgw4dkc2tp25ewjdfmc76wlql';

/** ZIP-321 payment URI, which Zcash wallets can read straight from a QR. */
export const DONATION_URI = `zcash:${DONATION_ADDRESS}`;
