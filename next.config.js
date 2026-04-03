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
          // M-01: Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com wss://*.supabase.co",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "font-src 'self' data:",
            ].join('; '),
          },
          // M-07: Additional security headers
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Download-Options', value: 'noopen' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
