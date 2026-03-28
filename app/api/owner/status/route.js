import {
  ACCESS_STATUS_MAX_REQUESTS,
  consumeAccessRouteRateLimit,
  createAccessJsonResponse,
  createLockedAccessResponse,
  logAccessAudit,
} from '../../../lib/access-route-security';
import {
  getOwnerModeClearCookieSettings,
  getOwnerModeStateFromRequest,
  shouldUseSecureOwnerCookie,
} from '../../../lib/owner-mode';

const OWNER_STATUS_SCOPE = 'owner:status:get';

export async function GET(req) {
  const rateLimit = await consumeAccessRouteRateLimit(req, {
    mode: 'owner',
    scope: OWNER_STATUS_SCOPE,
    maxRequests: ACCESS_STATUS_MAX_REQUESTS,
  });

  if (rateLimit.locked) {
    logAccessAudit({
      event: 'access_route_lockout',
      mode: 'owner',
      request: req,
      outcome: 'warn',
      reason: 'status_rate_limit',
    });
    return createLockedAccessResponse();
  }

  const ownerModeState = getOwnerModeStateFromRequest(req);
  const response = createAccessJsonResponse({
    active: ownerModeState.active,
    expiresAt: ownerModeState.active ? ownerModeState.expiresAt : null,
  });

  if (!ownerModeState.active && ownerModeState.hadCookie && ownerModeState.reason !== 'missing') {
    response.cookies.set(
      getOwnerModeClearCookieSettings({
        secure: shouldUseSecureOwnerCookie(req),
      })
    );

    logAccessAudit({
      event: 'access_status_denied',
      mode: 'owner',
      request: req,
      outcome: 'warn',
      reason: ownerModeState.reason,
    });
  }

  return response;
}
