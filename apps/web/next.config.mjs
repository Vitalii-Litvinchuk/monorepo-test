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
    const rules = [
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
      {
        source: '/socket.io/:path*',
        destination: `${apiInternalUrl}/socket.io/:path*`,
      },
    ];

    if (basePath) {
      rules.push(
        {
          source: `${basePath}/api/:path*`,
          destination: `${apiInternalUrl}/api/:path*`,
          basePath: false,
        },
        {
          source: `${basePath}/static/:path*`,
          destination: `${apiInternalUrl}/static/:path*`,
          basePath: false,
        },
        {
          source: `${basePath}/graphql`,
          destination: `${apiInternalUrl}/graphql`,
          basePath: false,
        },
        {
          source: `${basePath}/socket.io/:path*`,
          destination: `${apiInternalUrl}/socket.io/:path*`,
          basePath: false,
        },
      );
    }

    return rules;
  },
};

export default nextConfig;
