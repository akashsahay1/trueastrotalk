import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
	images: {
    // Allow images from all domains - like WordPress media library
    unoptimized: false,
    remotePatterns: [
      // Allow all HTTPS domains
      {
        protocol: 'https',
        hostname: '**',
      },
      // Allow all HTTP domains for development
      {
        protocol: 'http', 
        hostname: '**',
      },
    ],
  },
	
};

export default nextConfig;
