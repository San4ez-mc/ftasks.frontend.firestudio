/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*\\.(?:ico|png|svg|jpg|jpeg|js|css|woff|woff2))$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    
    // This resolves the "node:process" error by providing a mock for the process object
    // on the client-side bundle.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: require.resolve('process/browser'),
    };
    
    // This is a crucial fix. It ensures that 'firebase-admin' and 'jose' are only excluded
    // from the client-side bundle, not the server-side one.
    if (!isServer) {
        config.resolve.alias = {
            ...config.resolve.alias,
            'jose': false,
            'firebase-admin': false,
        };
    }
    
    return config;
  },
};

module.exports = nextConfig;
