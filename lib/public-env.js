const DEFAULT_PUBLIC_SITE_URL = 'https://likhle.vercel.app';

function normalizePublicSiteUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_PUBLIC_SITE_URL;
  }

  let parsed;

  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a valid absolute URL when provided.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must use http or https.');
  }

  return parsed.toString().replace(/\/$/, '');
}

export const publicEnv = Object.freeze({
  NEXT_PUBLIC_SITE_URL: normalizePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
});
