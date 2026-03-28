import {
  ACCESS_UNLOCK_DELETE_MAX_REQUESTS,
  clearAccessRouteFailures,
  consumeAccessRouteRateLimit,
  createAccessJsonResponse,
  createDeniedAccessResponse,
  createLockedAccessResponse,
  logAccessAudit,
  recordAccessRouteFailure,
} from '../../../lib/access-route-security';
import {
  createAdminModeSession,
  getAdminModeClearCookieSettings,
  getAdminModeCookieSettings,
  hasMatchingAdminSecret,
  isAdminModeConfigured,
  shouldUseSecureAdminCookie,
} from '../../../lib/owner-mode';

const ADMIN_UNLOCK_FAILURE_SCOPE = 'admin:unlock:post';
const ADMIN_UNLOCK_DELETE_SCOPE = 'admin:unlock:delete';

export async function POST(req) {
  let body = null;

  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const submittedSecret = typeof body?.secret === 'string' ? body.secret : '';
  const isConfigured = isAdminModeConfigured();
  const hasMatchingSecret = isConfigured && hasMatchingAdminSecret(submittedSecret);

  if (!hasMatchingSecret) {
    const failure = await recordAccessRouteFailure(req, {
      mode: 'admin',
      scope: ADMIN_UNLOCK_FAILURE_SCOPE,
      reason: isConfigured ? 'invalid_secret' : 'unconfigured',
    });

    if (failure.locked) {
      return createLockedAccessResponse();
    }

    return createDeniedAccessResponse();
  }

  await clearAccessRouteFailures(req, ADMIN_UNLOCK_FAILURE_SCOPE);

  const adminModeSession = createAdminModeSession();
  const response = createAccessJsonResponse({
    active: true,
    expiresAt: adminModeSession.expiresAt,
  });

  response.cookies.set(
    getAdminModeCookieSettings({
      value: adminModeSession.cookieValue,
      expiresAt: adminModeSession.expiresAt,
      secure: shouldUseSecureAdminCookie(req),
    })
  );

  logAccessAudit({
    event: 'access_unlock_success',
    mode: 'admin',
    request: req,
    reason: 'secret_verified',
  });

  return response;
}

export async function DELETE(req) {
  const rateLimit = await consumeAccessRouteRateLimit(req, {
    mode: 'admin',
    scope: ADMIN_UNLOCK_DELETE_SCOPE,
    maxRequests: ACCESS_UNLOCK_DELETE_MAX_REQUESTS,
  });

  if (rateLimit.locked) {
    return createLockedAccessResponse();
  }

  const response = createAccessJsonResponse({
    active: false,
  });

  response.cookies.set(
    getAdminModeClearCookieSettings({
      secure: shouldUseSecureAdminCookie(req),
    })
  );

  logAccessAudit({
    event: 'access_unlock_cleared',
    mode: 'admin',
    request: req,
    reason: 'cookie_cleared',
  });

  return response;
}
