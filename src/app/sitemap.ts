import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dietly.es';
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/software-nutricionista-ia`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/legal/terminos`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/legal/privacidad`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/derechos-datos`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/politica-cookies`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
