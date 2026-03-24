import { siteVersion, siteVersionLabel } from '../../lib/site';

/**
 * Public app version for ops, clients, and debugging.
 * Kept in sync with package.json via app/lib/site.js.
 */
export async function GET() {
  return Response.json(
    {
      name: 'likhle',
      version: siteVersion,
      label: siteVersionLabel,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Likhle-Version': siteVersion,
      },
    }
  );
}
