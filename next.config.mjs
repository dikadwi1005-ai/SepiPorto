import { fileURLToPath } from 'node:url';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
