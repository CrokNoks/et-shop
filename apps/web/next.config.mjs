/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactive le linting et le typecheck pendant le build pour accélérer Firebase Cloud Build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimisation pour les environnements serverless
  output: 'standalone',
};

export default nextConfig;
