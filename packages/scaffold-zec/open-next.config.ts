import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';

export default defineCloudflareConfig({
  // /api/chain-tip exports revalidate=30; without an incremental cache the
  // build-time snapshot would be served forever. KV is the lightest option
  // that works on the free tier (R2 is not enabled on this account).
  incrementalCache: kvIncrementalCache,
  // Inline revalidation. The queue-based flavors need a Durable Object,
  // which is not worth it for one 30-second route.
  queue: 'direct',
});
