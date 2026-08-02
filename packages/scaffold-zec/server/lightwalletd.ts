/**
 * Minimal lightwalletd client for server-side verification.
 *
 * Only GetTransaction is needed, so rather than pulling in protoc and a gRPC
 * stack we hand-encode the one request message and parse the one response.
 * Talks gRPC-web over plain fetch through the same proxy the browser uses.
 *
 * What this can prove: a transaction with this txid exists and is mined.
 * What it cannot prove: who sent it, to whom, or for how much — that is the
 * point of a shielded chain, and the verification model is built around it.
 */

const PROXY =
  process.env.LIGHTWALLETD_PROXY ??
  process.env.NEXT_PUBLIC_LIGHTWALLETD_PROXY ??
  'http://localhost:8080';

const GET_TRANSACTION =
  '/cash.z.wallet.sdk.rpc.CompactTxStreamer/GetTransaction';
const GET_LATEST_BLOCK =
  '/cash.z.wallet.sdk.rpc.CompactTxStreamer/GetLatestBlock';

export interface TransactionLookup {
  found: boolean;
  mined: boolean;
  height: number | null;
}

function txidToBytes(txid: string): Uint8Array {
  const hex = txid.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) throw new Error('malformed txid');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  // Txids are displayed in reverse byte order; the wire wants internal order.
  return bytes.reverse();
}

/** TxFilter { hash = 3 }, wrapped in a gRPC-web data frame. */
function encodeRequest(txid: string): Uint8Array {
  const hash = txidToBytes(txid);
  const message = new Uint8Array(2 + hash.length);
  message[0] = (3 << 3) | 2;
  message[1] = hash.length;
  message.set(hash, 2);

  const frame = new Uint8Array(5 + message.length);
  frame[0] = 0x00;
  new DataView(frame.buffer).setUint32(1, message.length, false);
  frame.set(message, 5);
  return frame;
}

function readVarint(buf: Uint8Array, offset: number): [number, number] {
  let result = 0;
  let shift = 0;
  let i = offset;
  for (; i < buf.length; i++) {
    result += (buf[i] & 0x7f) * 2 ** shift;
    if ((buf[i] & 0x80) === 0) break;
    shift += 7;
  }
  return [result, i + 1];
}

/** Pull `height` (field 2) out of a RawTransaction data frame. */
function decodeHeight(body: Uint8Array): number | null {
  if (body.length < 5 || body[0] !== 0x00) return null;
  const length = new DataView(
    body.buffer,
    body.byteOffset + 1,
    4,
  ).getUint32(0, false);
  const message = body.subarray(5, 5 + length);

  let offset = 0;
  while (offset < message.length) {
    const [tag, afterTag] = readVarint(message, offset);
    const field = tag >> 3;
    const wireType = tag & 0x07;
    if (field === 2 && wireType === 0) {
      const [height] = readVarint(message, afterTag);
      return height;
    }
    if (wireType === 2) {
      const [len, afterLen] = readVarint(message, afterTag);
      offset = afterLen + len;
    } else if (wireType === 0) {
      const [, next] = readVarint(message, afterTag);
      offset = next;
    } else {
      break;
    }
  }
  return null;
}

/** Current chain tip, so the landing page can show a live block without
 *  making every visitor download the wallet's wasm. */
export async function getChainTip(): Promise<number | null> {
  const empty = new Uint8Array([0x00, 0, 0, 0, 0]);
  const response = await fetch(`${PROXY}${GET_LATEST_BLOCK}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/grpc-web+proto',
      'x-grpc-web': '1',
    },
    body: empty.buffer as ArrayBuffer,
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const body = new Uint8Array(await response.arrayBuffer());
  if (body.length < 5) return null;

  // BlockID { height = 1 }
  const length = new DataView(body.buffer, body.byteOffset + 1, 4).getUint32(
    0,
    false,
  );
  const message = body.subarray(5, 5 + length);
  const [tag, afterTag] = readVarint(message, 0);
  if (tag >> 3 !== 1) return null;
  const [height] = readVarint(message, afterTag);
  return height > 0 ? height : null;
}

export async function lookupTransaction(
  txid: string,
): Promise<TransactionLookup> {
  const frame = encodeRequest(txid);
  const response = await fetch(`${PROXY}${GET_TRANSACTION}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/grpc-web+proto',
      'x-grpc-web': '1',
    },
    body: frame.buffer as ArrayBuffer,
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`lightwalletd ${response.status}`);

  const body = new Uint8Array(await response.arrayBuffer());

  // An unknown txid makes lightwalletd error, which reaches us either as a
  // non-zero grpc-status (header or trailer, depending on the proxy) or as a
  // completely empty body. Treating an empty body as "found" would tell
  // builders their invented txid was merely unmined.
  const headerStatus = response.headers.get('grpc-status');
  const trailerStatus = new TextDecoder()
    .decode(body)
    .match(/grpc-status:\s*(\d+)/)?.[1];
  const status = headerStatus ?? trailerStatus;

  if (body.length === 0 || (status && status !== '0')) {
    return { found: false, mined: false, height: null };
  }

  const height = decodeHeight(body);
  // Unmined transactions report -1, which arrives as a max-range uint64.
  const mined = height !== null && height > 0 && height < 2 ** 32;
  return { found: true, mined, height: mined ? height : null };
}
