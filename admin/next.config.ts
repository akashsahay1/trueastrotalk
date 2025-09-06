import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Build configuration */
  eslint: {
    // ESLint enabled for build-time quality checks
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors don't block the build - all errors fixed!
    ignoreBuildErrors: false,
  },
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
    // Image optimization settings
    minimumCacheTTL: 60 * 60 * 24 * 7, // Cache images for 1 week
    formats: ['image/webp', 'image/avif'],
  },
  
  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  
  // Bundle optimization
  // swcMinify is now default in Next.js 13+
  
  // Experimental features for performance
  experimental: {
    // Optimize CSS is now handled automatically
  },
  
  // Support for CSS modules and global CSS
  sassOptions: {
    includePaths: ['./src/styles'],
  },
  
  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          }
        ],
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache static assets for 1 year
          },
        ],
      },
    ];
  },
  
  // Enable webpack bundle analyzer in development
  webpack: (config, { dev, isServer }) => {
    // Fix punycode deprecation warning by aliasing to userland module
    config.resolve.alias = {
      ...config.resolve.alias,
      'punycode': 'punycode/',
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(BundleAnalyzerPlugin);
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      // Tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
