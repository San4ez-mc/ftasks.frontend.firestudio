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
  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: false,
    };
    
    // This is a crucial fix. It ensures that 'firebase-admin' is only excluded
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
