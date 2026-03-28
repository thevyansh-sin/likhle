import {
  ACCESS_STATUS_MAX_REQUESTS,
  consumeAccessRouteRateLimit,
  createAccessJsonResponse,
  createLockedAccessResponse,
  logAccessAudit,
} from '../../../lib/access-route-security';
import {
  getAdminModeClearCookieSettings,
  getAdminModeStateFromRequest,
  shouldUseSecureAdminCookie,
} from '../../../lib/owner-mode';

const ADMIN_STATUS_SCOPE = 'admin:status:get';

export async function GET(req) {
  const rateLimit = await consumeAccessRouteRateLimit(req, {
    mode: 'admin',
    scope: ADMIN_STATUS_SCOPE,
    maxRequests: ACCESS_STATUS_MAX_REQUESTS,
  });

  if (rateLimit.locked) {
    logAccessAudit({
      event: 'access_route_lockout',
      mode: 'admin',
      request: req,
      outcome: 'warn',
      reason: 'status_rate_limit',
    });
    return createLockedAccessResponse();
  }

  const adminModeState = getAdminModeStateFromRequest(req);
  const response = createAccessJsonResponse({
    active: adminModeState.active,
    expiresAt: adminModeState.active ? adminModeState.expiresAt : null,
  });

  if (!adminModeState.active && adminModeState.hadCookie && adminModeState.reason !== 'missing') {
    response.cookies.set(
      getAdminModeClearCookieSettings({
        secure: shouldUseSecureAdminCookie(req),
      })
    );

    logAccessAudit({
      event: 'access_status_denied',
      mode: 'admin',
      request: req,
      outcome: 'warn',
      reason: adminModeState.reason,
    });
  }

  return response;
}
