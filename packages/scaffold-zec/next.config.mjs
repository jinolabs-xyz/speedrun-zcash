/** @type {import('next').NextConfig} */
const nextConfig = {
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
