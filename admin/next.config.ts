import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
	images: {
    remotePatterns: [
			{
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/avataaars/**',
      },
			{
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
		],
  },
	
};

export default nextConfig;
