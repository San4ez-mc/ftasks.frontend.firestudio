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
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: false,
    };
    // This is a workaround for a persistent build issue.
    // It ensures that if 'jose' or 'firebase-admin' are ever included in the client-side bundle,
    // they are replaced with an empty module to prevent errors.
    config.resolve.alias = {
        ...config.resolve.alias,
        'jose': false,
        'firebase-admin': false,
    };
    return config;
  },
};

module.exports = nextConfig;
