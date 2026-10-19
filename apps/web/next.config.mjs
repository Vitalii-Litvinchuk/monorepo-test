const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const cleanBasePath = rawBasePath.replace(/\/+$/, '').trim();
const basePath = cleanBasePath ? (cleanBasePath.startsWith('/') ? cleanBasePath : `/${cleanBasePath}`) : undefined;
const apiInternalUrl = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath,
  transpilePackages: ['@dzencode/contracts'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${apiInternalUrl}/static/:path*`,
      },
      {
        source: '/graphql',
        destination: `${apiInternalUrl}/graphql`,
      },
    ];
  },
};

export default nextConfig;
