import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/p/', '/onboarding/'],
    },
    sitemap: 'https://dietly.es/sitemap.xml',
  };
}
