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
      // Bloquear endpoints de test en producción
      ...(process.env.NODE_ENV === 'production'
        ? [
            { source: '/api/test-pdf', destination: '/404', permanent: false },
            { source: '/api/test-stream', destination: '/404', permanent: false },
            { source: '/api/e2e-setup', destination: '/404', permanent: false },
          ]
        : []),
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
