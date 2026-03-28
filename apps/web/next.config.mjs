/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimisation pour les environnements serverless
  output: 'standalone',
};

export default nextConfig;
