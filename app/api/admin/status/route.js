import { getAdminModeStateFromRequest, isAdminModeConfigured } from '../../../lib/owner-mode';

export async function GET(req) {
  const adminModeState = getAdminModeStateFromRequest(req);

  return Response.json(
    {
      active: adminModeState.active,
      configured: isAdminModeConfigured(),
      expiresAt: adminModeState.active ? adminModeState.expiresAt : null,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
