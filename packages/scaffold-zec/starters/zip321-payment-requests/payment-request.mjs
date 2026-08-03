/**
 * Challenge #4 — Shielded Storefront, step "Generate payment requests".
 *
 * A storefront cannot watch for "a payment of 3 TAZ" and know which order it
 * belongs to: shielded transactions carry no sender and no invoice number
 * the chain can show you. ZIP 321 is how the request itself carries that
 * context — the URI you hand the buyer prefills the amount and an order-ID
 * memo, so what comes back is identifiable when your viewing key decrypts it.
 *
 * Implement the two functions below. `npm run test:starters` (or
 * `node --test starters/`) tells you when they're right.
 *
 * Spec: https://zips.z.cash/zip-0321
 */

/** Zatoshis per ZEC. Amounts are decimal ZEC in the URI, integers on chain. */
export const COIN = 100_000_000;

/**
 * Build a single-payment ZIP 321 URI.
 *
 * @param {object} payment
 * @param {string} payment.address    recipient address, unvalidated here
 * @param {number} [payment.amountZats] amount in zatoshis
 * @param {string} [payment.memo]     UTF-8 memo text, encoded base64url
 * @param {string} [payment.label]    label for the recipient
 * @param {string} [payment.message]  message shown to the payer
 * @returns {string} e.g. zcash:ztestsapling1...?amount=0.1&memo=b3JkZXI
 *
 * Rules worth reading the spec for:
 *  - the address is the URI path, not a query parameter, in the single-
 *    payment form
 *  - `amount` is decimal ZEC with at most 8 fractional digits, and no
 *    trailing zeroes (0.1, never 0.10000000)
 *  - `memo` is base64url WITHOUT padding (no trailing '=')
 *  - omit parameters that weren't supplied; don't emit empty ones
 */
export function buildPaymentUri(payment) {
  // TODO: implement
  throw new Error('not implemented');
}

/**
 * Parse a single-payment ZIP 321 URI back into its parts.
 *
 * @param {string} uri
 * @returns {{address: string, amountZats?: number, memo?: string,
 *            label?: string, message?: string}}
 * @throws if the URI is not a valid single-payment ZIP 321 request
 *
 * Reject rather than guess when:
 *  - the scheme is not `zcash:`
 *  - `amount` has more than 8 fractional digits, is negative, or is not a
 *    number
 *  - a parameter appears more than once (the spec calls this invalid, and
 *    silently taking the first would let a crafted URI show one amount and
 *    mean another)
 *  - a parameter name you do not recognise starts with `req-` (the spec
 *    reserves that prefix for things a parser MUST understand)
 */
export function parsePaymentUri(uri) {
  // TODO: implement
  throw new Error('not implemented');
}
