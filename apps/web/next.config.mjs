/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimisation pour les environnements serverless
  output: 'standalone',
};

export default nextConfig;
