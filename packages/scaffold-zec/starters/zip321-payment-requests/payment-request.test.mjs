import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPaymentUri, parsePaymentUri, COIN } from './payment-request.mjs';

/**
 * Assert that `fn` rejects its input on the merits. A bare assert.throws
 * would also pass against an unimplemented stub, telling you a validation
 * test is green before you have written any validation.
 */
function rejects(fn, why) {
  assert.throws(fn, (err) => {
    assert.doesNotMatch(
      err.message,
      /not implemented/,
      'still a stub, so this test cannot pass yet',
    );
    return true;
  }, why);
}

const ADDR =
  'ztestsapling1vkqgrjdmeuyyjrtnk2x3kvajj3gzaaufyp88n00ukyxfws6fga6mx3d8w8rjmep2c7ngqux0fhz';

test('builds a bare request with only an address', () => {
  assert.equal(buildPaymentUri({ address: ADDR }), `zcash:${ADDR}`);
});

test('renders the amount as decimal ZEC, not zatoshis', () => {
  const uri = buildPaymentUri({ address: ADDR, amountZats: 0.1 * COIN });
  assert.match(uri, /[?&]amount=0\.1(&|$)/);
});

test('drops trailing zeroes from the amount', () => {
  const uri = buildPaymentUri({ address: ADDR, amountZats: 1.5 * COIN });
  assert.match(uri, /[?&]amount=1\.5(&|$)/);
  assert.doesNotMatch(uri, /amount=1\.50/);
});

test('keeps sub-zatoshi precision out of the amount', () => {
  const uri = buildPaymentUri({ address: ADDR, amountZats: 1 });
  assert.match(uri, /[?&]amount=0\.00000001(&|$)/);
});

test('encodes the memo as base64url with no padding', () => {
  const uri = buildPaymentUri({ address: ADDR, memo: 'order-42' });
  const memo = new URL(uri).searchParams.get('memo');
  assert.ok(memo, 'expected a memo parameter');
  assert.doesNotMatch(memo, /=/, 'base64url in a URI must not be padded');
  assert.doesNotMatch(memo, /[+/]/, 'base64url uses - and _, not + and /');
  assert.equal(Buffer.from(memo, 'base64url').toString('utf8'), 'order-42');
});

test('omits parameters that were not supplied', () => {
  const uri = buildPaymentUri({ address: ADDR, amountZats: COIN });
  assert.doesNotMatch(uri, /memo=/);
  assert.doesNotMatch(uri, /label=/);
  assert.doesNotMatch(uri, /message=/);
});

test('round-trips everything it can carry', () => {
  const payment = {
    address: ADDR,
    amountZats: 2.25 * COIN,
    memo: 'order-42',
    label: 'Coffee',
    message: 'Thanks for your order',
  };
  assert.deepEqual(parsePaymentUri(buildPaymentUri(payment)), payment);
});

test('parses an amount into whole zatoshis', () => {
  const { amountZats } = parsePaymentUri(`zcash:${ADDR}?amount=0.00000001`);
  assert.equal(amountZats, 1);
  assert.ok(Number.isInteger(amountZats), 'zatoshis are integers');
});

// Floating point is the trap here: 0.1 * 3 is 0.30000000000000004, and a
// storefront that rounds the wrong way undercharges every order.
test('parses amounts without floating-point drift', () => {
  const { amountZats } = parsePaymentUri(`zcash:${ADDR}?amount=0.3`);
  assert.equal(amountZats, 30_000_000);
});

test('rejects a scheme that is not zcash', () => {
  rejects(() => parsePaymentUri(`bitcoin:${ADDR}?amount=1`));
});

test('rejects more precision than a zatoshi', () => {
  rejects(() => parsePaymentUri(`zcash:${ADDR}?amount=0.000000001`));
});

test('rejects a negative amount', () => {
  rejects(() => parsePaymentUri(`zcash:${ADDR}?amount=-1`));
});

test('rejects an amount that is not a number', () => {
  rejects(() => parsePaymentUri(`zcash:${ADDR}?amount=free`));
});

// A URI showing one amount and meaning another is the whole reason the spec
// calls duplicates invalid.
test('rejects a duplicated parameter', () => {
  rejects(() => parsePaymentUri(`zcash:${ADDR}?amount=1&amount=2`));
});

test('rejects a req- parameter it does not understand', () => {
  rejects(() => parsePaymentUri(`zcash:${ADDR}?req-futurething=1`));
});

test('ignores an unknown parameter without the req- prefix', () => {
  const parsed = parsePaymentUri(`zcash:${ADDR}?amount=1&somethingnew=x`);
  assert.equal(parsed.address, ADDR);
  assert.equal(parsed.amountZats, COIN);
});
