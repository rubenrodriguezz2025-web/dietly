/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],

async redirects() {
    return [
      // Alias antiguo /dashboard/rgpd → ruta correcta
      {
        source: '/dashboard/rgpd',
        destination: '/dashboard/derechos-datos',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;