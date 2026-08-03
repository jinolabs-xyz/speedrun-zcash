import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// No-op outside `next dev`: wires the wrangler.jsonc bindings (local D1 etc.)
// into the dev server so server code sees the same env shape as on Workers.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A stray lockfile in the home directory makes Next guess the wrong
  // workspace root, which would also mislead OpenNext's file tracing.
  outputFileTracingRoot: import.meta.dirname,
  // StrictMode's double-mount initializes the WebZjs wasm module twice
  // concurrently, which wedges its async runtime — keep it off.
  reactStrictMode: false,
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // wasm_thread's worker snippet imports the chunk that spawned it, which
    // trips webpack's "circular hash dependency" check under content hashing.
    config.optimization = { ...config.optimization, realContentHash: false };
    return config;
  },
  // WebZjs's WASM thread pool needs SharedArrayBuffer, which browsers only
  // enable on cross-origin-isolated pages.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default nextConfig;
