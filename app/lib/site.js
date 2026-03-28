import packageJson from '../../package.json';
import { publicEnv } from '../../lib/public-env';

export const siteName = 'Likhle';
export const siteTitle = 'The writing tool for how India actually posts';
export const siteDescription =
  'Likhle helps Indian creators write captions, bios, hooks, and statuses with control over platform, tone, length, Hinglish, hashtags, and image context.';
export const siteVersion = packageJson.version;
export const siteVersionLabel = `v${siteVersion}`;
export const siteVersionPrefix = 'v';
export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
export const supportEmail = 'likhlesupport@gmail.com';
export const instagramHandle = '@likhle.in';
export const instagramUrl = 'https://instagram.com/likhle.in';
export const siteKeywords = [
  'AI caption generator',
  'Instagram caption generator',
  'Instagram bio generator',
  'Reels hook generator',
  'WhatsApp status generator',
  'LinkedIn bio generator',
  'Twitter bio generator',
  'Hinglish caption generator',
  'AI writing tool India',
  'Gen Z writing tool',
];

export function absoluteUrl(path = '/') {
  return new URL(path, `${siteUrl}/`).toString();
}

export function buildMetadata({ title, description = siteDescription, path = '/', keywords = [] }) {
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | ${siteTitle}`;

  return {
    title,
    description,
    keywords: [...siteKeywords, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      creator: instagramHandle,
    },
  };
}
