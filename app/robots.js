import { siteUrl } from './lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt'],
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
