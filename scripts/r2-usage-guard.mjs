#!/usr/bin/env node
/**
 * Fails when month-to-date R2 usage approaches the free-tier limits, so a
 * runaway (bad cache headers, a scraper hammering the wasm, an upload loop)
 * surfaces as a red scheduled workflow instead of a surprise bill.
 *
 * Free tier: 10 GB stored, 1M Class A ops, 10M Class B ops per month.
 * We alarm at 80% — R2 bills overage automatically, so the alarm must fire
 * while there is still month left to react.
 *
 * Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
 */

const LIMITS = {
  storageBytes: 10 * 1024 ** 3,
  classA: 1_000_000,
  classB: 10_000_000,
};
const ALARM_AT = 0.8;

// Per Cloudflare's R2 pricing docs. Deletes and aborts are free. Anything
// unrecognized counts as Class A so new operation types fail toward caution.
const CLASS_B = new Set([
  'HeadBucket',
  'HeadObject',
  'GetObject',
  'UsageSummary',
  'GetBucketEncryption',
  'GetBucketLocation',
  'GetBucketCors',
  'GetBucketLifecycleConfiguration',
]);
const FREE = new Set(['DeleteObject', 'DeleteBucket', 'AbortMultipartUpload']);

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) {
  console.error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');
  process.exit(1);
}

const now = new Date();
const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

const query = `query($acc: String!, $since: Time!, $until: Time!) {
  viewer { accounts(filter: {accountTag: $acc}) {
    r2OperationsAdaptiveGroups(limit: 500, filter: {datetime_geq: $since, datetime_leq: $until}) {
      dimensions { actionType } sum { requests }
    }
    r2StorageAdaptiveGroups(limit: 100, filter: {datetime_geq: $since, datetime_leq: $until}) {
      dimensions { bucketName } max { payloadSize metadataSize }
    }
  } }
}`;

const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: {
      acc: account,
      since: monthStart.toISOString(),
      until: now.toISOString(),
    },
  }),
});
const payload = await response.json();
if (payload.errors?.length) {
  console.error('GraphQL errors:', JSON.stringify(payload.errors));
  process.exit(1);
}

const accountData = payload.data?.viewer?.accounts?.[0];
if (!accountData) {
  console.error('no account data returned — check the token scopes');
  process.exit(1);
}

let classA = 0;
let classB = 0;
for (const group of accountData.r2OperationsAdaptiveGroups ?? []) {
  const action = group.dimensions.actionType;
  const requests = group.sum.requests;
  if (FREE.has(action)) continue;
  if (CLASS_B.has(action)) classB += requests;
  else classA += requests;
}

// payloadSize is a point-in-time gauge per bucket; the max over the month is
// the peak we could be billed toward.
let storageBytes = 0;
for (const group of accountData.r2StorageAdaptiveGroups ?? []) {
  storageBytes += (group.max.payloadSize ?? 0) + (group.max.metadataSize ?? 0);
}

const rows = [
  ['storage', storageBytes, LIMITS.storageBytes, `${(storageBytes / 1024 ** 3).toFixed(2)} GB of 10 GB`],
  ['class A ops', classA, LIMITS.classA, `${classA.toLocaleString()} of 1,000,000`],
  ['class B ops', classB, LIMITS.classB, `${classB.toLocaleString()} of 10,000,000`],
];

let failed = false;
for (const [name, used, limit, human] of rows) {
  const fraction = used / limit;
  const marker = fraction >= ALARM_AT ? 'ALARM' : 'ok';
  if (fraction >= ALARM_AT) failed = true;
  console.log(`${marker.padEnd(6)} ${name.padEnd(12)} ${human} (${(fraction * 100).toFixed(1)}%)`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  const table = [
    '| metric | month to date | limit | used |',
    '| --- | --- | --- | --- |',
    ...rows.map(([name, used, limit, human]) =>
      `| ${name} | ${human} | ${limit.toLocaleString()} | ${((used / limit) * 100).toFixed(1)}% |`),
  ].join('\n');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## R2 free-tier usage\n\n${table}\n`);
}

if (failed) {
  console.error(
    `\nAt or past ${ALARM_AT * 100}% of an R2 free-tier limit. Likely causes, in order: ` +
      'wasm reads bypassing the edge cache (check the worker\'s /webzjs/* cache behavior), ' +
      'a scripted scraper, or an upload loop. R2 bills overage automatically — act now.',
  );
  process.exit(1);
}
