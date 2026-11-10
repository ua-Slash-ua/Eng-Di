import type { NextConfig } from 'next';
import path from 'path';
import { resolveMainApiUrl } from './src/lib/env';

const API = resolveMainApiUrl();

const nextConfig: NextConfig = {
  // Avoid picking a parent package-lock.json (e.g. ~/package-lock.json on hosting)
  outputFileTracingRoot: path.join(__dirname),
  // Shared hosting: less RAM during "Collecting page data" (avoid SIGKILL / OOM)
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 999,
    // File uploads go through /api/* middleware (default 10MB truncates multipart)
    middlewareClientMaxBodySize: '64mb',
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${API}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
