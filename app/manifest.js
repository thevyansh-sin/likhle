import { siteDescription, siteName } from './lib/site';

export default function manifest() {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#080808',
    theme_color: '#080808',
    lang: 'en-IN',
    categories: ['productivity', 'social', 'writing'],
    shortcuts: [
      {
        name: 'Open generator',
        short_name: 'Generate',
        url: '/generate',
        description: 'Jump straight into the main writing tool.',
      },
      {
        name: 'Instagram captions',
        short_name: 'Captions',
        url: '/instagram-caption-generator',
        description: 'Open the Instagram caption flow.',
      },
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
