import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  serverRuntimeConfig: {
    // Will only be available on the server side
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiBaseUrl: process.env.API_BASE_URL,
  },
};

export default nextConfig;
