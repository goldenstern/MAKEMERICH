import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: '0x7208B715834e089646f2219F8DBBc63aEf433357',
    NEXT_PUBLIC_TOKEN_ADDRESS: '0x29975FA9aa0739383C8aDb5c1877280E8ba24465',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
        hostname: 'images.unsplash.com',
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
};

export default nextConfig;
