/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce potential issues
  swcMinify: true,
  images: {
    unoptimized: true, // Disable image optimization to fix screenshot loading
    domains: ['cdn-icons-png.flaticon.com', 'upload.wikimedia.org', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'app.catphishlabs.ca',
        pathname: '/uploads/**',
      },
    ],
  },
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 10,
  },
  webpack: (config, { isServer }) => {
    // Increase chunk loading timeout
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 500,
      poll: 1000,
    };
    
    // Add chunk loading timeout configuration
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          // This is the important part for fixing chunk loading errors
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@next|next|react|react-dom)[\\/]/,
            priority: 40,
            enforce: true,
          },
        },
      };
    }
    
    return config;
  },
  // Increase timeout for static generation
  staticPageGenerationTimeout: 180,
}

module.exports = nextConfig;
