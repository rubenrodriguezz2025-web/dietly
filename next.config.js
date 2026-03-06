/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],

  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;