import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance optimizations */
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Enable compression
  compress: true,

  // Bundle analyzer for development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: { plugins: any[] }) => {
      // Dynamic import to avoid requiring webpack-bundle-analyzer in production
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),

  // Development indicators
  devIndicators: {
    position: 'bottom-right',
  },

  // Production optimizations
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
