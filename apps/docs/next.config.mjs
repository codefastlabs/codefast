/** @type { import("next").NextConfig } */
const nextConfig = {
  transpilePackages: ['@codefast/hooks', '@codefast/third-parties', '@codefast/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
