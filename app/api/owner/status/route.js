import { getOwnerModeStateFromRequest, isOwnerModeConfigured } from '../../../lib/owner-mode';

export async function GET(req) {
  const ownerModeState = getOwnerModeStateFromRequest(req);

  return Response.json(
    {
      active: ownerModeState.active,
      configured: isOwnerModeConfigured(),
      expiresAt: ownerModeState.active ? ownerModeState.expiresAt : null,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
