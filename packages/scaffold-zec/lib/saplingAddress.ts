/**
 * Extract the Sapling receiver from a unified address, client-side.
 *
 * Since NU6.3 "Ironwood", wallets paying a UA prefer the Ironwood pool
 * (the rule is ZIP 326's; ZIP 2006 has no published text), which our
 * NU6-era WebZjs build cannot scan — so funds
 * sent to the UA never show up. Funds sent to the bare Sapling address
 * land as Sapling outputs, which scan fine. The wasm exposes no way to
 * get that address, so we decode the UA ourselves per ZIP 316:
 * bech32m → F4Jumble⁻¹ → TLV receivers → re-encode receiver 0x02 as a
 * ztestsapling/zs bech32 address.
 */

import { blake2b } from '@noble/hashes/blake2.js';

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= GEN[i];
  }
  return chk >>> 0;
}

function hrpExpand(hrp: string): number[] {
  const out = [];
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5);
  out.push(0);
  for (const c of hrp) out.push(c.charCodeAt(0) & 31);
  return out;
}

/** Decode without BIP-173's 90-char cap — UAs are far longer (ZIP 316). */
function bech32Decode(
  addr: string,
  expectedConst: number,
): { hrp: string; data: number[] } | null {
  const lower = addr.toLowerCase();
  if (addr !== lower && addr !== addr.toUpperCase()) return null;
  const pos = lower.lastIndexOf('1');
  if (pos < 1 || pos + 7 > lower.length) return null;
  const hrp = lower.slice(0, pos);
  const data: number[] = [];
  for (const c of lower.slice(pos + 1)) {
    const v = CHARSET.indexOf(c);
    if (v === -1) return null;
    data.push(v);
  }
  if (polymod([...hrpExpand(hrp), ...data]) !== expectedConst) return null;
  return { hrp, data: data.slice(0, -6) };
}

function bech32Encode(hrp: string, data: number[]): string {
  const values = [...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ BECH32_CONST;
  const checksum = [];
  for (let i = 0; i < 6; i++) checksum.push((mod >>> (5 * (5 - i))) & 31);
  return hrp + '1' + [...data, ...checksum].map((v) => CHARSET[v]).join('');
}

function convertBits(
  data: ArrayLike<number>,
  from: number,
  to: number,
  pad: boolean,
): number[] | null {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  const maxv = (1 << to) - 1;
  for (let i = 0; i < data.length; i++) {
    acc = (acc << from) | data[i];
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (to - bits)) & maxv);
  } else if (bits >= from || (acc << (to - bits)) & maxv) {
    return null;
  }
  return out;
}

// --- F4Jumble inverse (ZIP 316) -------------------------------------------

function personal(prefix: 'G' | 'H', i: number, j: number): Uint8Array {
  const p = new Uint8Array(16);
  p.set(new TextEncoder().encode(`UA_F4Jumble_${prefix}`));
  p[13] = i;
  p[14] = j & 0xff;
  p[15] = j >> 8;
  return p;
}

function xorInto(target: Uint8Array, other: Uint8Array): void {
  for (let k = 0; k < target.length; k++) target[k] ^= other[k];
}

function gRound(i: number, u: Uint8Array, outLen: number): Uint8Array {
  const out = new Uint8Array(outLen);
  for (let j = 0; j * 64 < outLen; j++) {
    const block = blake2b(u, { dkLen: 64, personalization: personal('G', i, j) });
    out.set(block.subarray(0, Math.min(64, outLen - j * 64)), j * 64);
  }
  return out;
}

function hRound(i: number, u: Uint8Array, outLen: number): Uint8Array {
  return blake2b(u, { dkLen: outLen, personalization: personal('H', i, 0) });
}

function f4JumbleInv(message: Uint8Array): Uint8Array {
  const lL = Math.min(64, Math.floor(message.length / 2));
  const a = message.slice(0, lL);
  const b = message.slice(lL);
  xorInto(a, hRound(1, b, lL));
  xorInto(b, gRound(1, a, b.length));
  xorInto(a, hRound(0, b, lL));
  xorInto(b, gRound(0, a, b.length));
  const out = new Uint8Array(message.length);
  out.set(a);
  out.set(b, lL);
  return out;
}

// --- UA parsing ------------------------------------------------------------

const SAPLING_TYPECODE = 2;

function readCompactSize(buf: Uint8Array, off: number): [number, number] | null {
  if (off >= buf.length) return null;
  const first = buf[off];
  if (first < 253) return [first, off + 1];
  // Receiver typecodes and lengths never need the multi-byte forms.
  return null;
}

/**
 * Returns the standalone Sapling address embedded in a unified address, or
 * null if the UA has no Sapling receiver (or isn't a valid UA).
 */
export function saplingAddressFromUnified(
  unified: string,
  network: string,
): string | null {
  const uaHrp = network === 'main' ? 'u' : 'utest';
  const saplingHrp = network === 'main' ? 'zs' : 'ztestsapling';

  const decoded = bech32Decode(unified, BECH32M_CONST);
  if (!decoded || decoded.hrp !== uaHrp) return null;
  const jumbled = convertBits(decoded.data, 5, 8, false);
  if (!jumbled || jumbled.length < 48) return null;

  const message = f4JumbleInv(Uint8Array.from(jumbled));

  // Message ends with the HRP zero-padded to 16 bytes.
  const padding = new Uint8Array(16);
  padding.set(new TextEncoder().encode(uaHrp));
  const tail = message.subarray(message.length - 16);
  if (!tail.every((byte, k) => byte === padding[k])) return null;

  const tlv = message.subarray(0, message.length - 16);
  let off = 0;
  while (off < tlv.length) {
    const type = readCompactSize(tlv, off);
    if (!type) return null;
    const len = readCompactSize(tlv, type[1]);
    if (!len || len[1] + len[0] > tlv.length) return null;
    if (type[0] === SAPLING_TYPECODE && len[0] === 43) {
      const receiver = tlv.subarray(len[1], len[1] + 43);
      return bech32Encode(saplingHrp, convertBits(receiver, 8, 5, true)!);
    }
    off = len[1] + len[0];
  }
  return null;
}
