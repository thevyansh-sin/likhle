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
  createOwnerModeSession,
  getOwnerModeClearCookieSettings,
  getOwnerModeCookieSettings,
  hasMatchingOwnerSecret,
  isOwnerModeConfigured,
  shouldUseSecureOwnerCookie,
} from '../../../lib/owner-mode';
import { getSubmittedSecretFromBody } from '../../../lib/request-validation';

const OWNER_UNLOCK_FAILURE_SCOPE = 'owner:unlock:post';
const OWNER_UNLOCK_DELETE_SCOPE = 'owner:unlock:delete';

export async function POST(req) {
  let body = null;

  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const submittedSecret = getSubmittedSecretFromBody(body);
  const isConfigured = isOwnerModeConfigured();
  const hasMatchingSecret = isConfigured && hasMatchingOwnerSecret(submittedSecret);

  if (!hasMatchingSecret) {
    const failure = await recordAccessRouteFailure(req, {
      mode: 'owner',
      scope: OWNER_UNLOCK_FAILURE_SCOPE,
      reason: isConfigured ? 'invalid_secret' : 'unconfigured',
    });

    if (failure.locked) {
      return createLockedAccessResponse();
    }

    return createDeniedAccessResponse();
  }

  await clearAccessRouteFailures(req, OWNER_UNLOCK_FAILURE_SCOPE);

  const ownerModeSession = createOwnerModeSession();
  const response = createAccessJsonResponse({
    active: true,
    expiresAt: ownerModeSession.expiresAt,
  });

  response.cookies.set(
    getOwnerModeCookieSettings({
      value: ownerModeSession.cookieValue,
      expiresAt: ownerModeSession.expiresAt,
      secure: shouldUseSecureOwnerCookie(req),
    })
  );

  logAccessAudit({
    event: 'access_unlock_success',
    mode: 'owner',
    request: req,
    reason: 'secret_verified',
  });

  return response;
}

export async function DELETE(req) {
  const rateLimit = await consumeAccessRouteRateLimit(req, {
    mode: 'owner',
    scope: OWNER_UNLOCK_DELETE_SCOPE,
    maxRequests: ACCESS_UNLOCK_DELETE_MAX_REQUESTS,
  });

  if (rateLimit.locked) {
    return createLockedAccessResponse();
  }

  const response = createAccessJsonResponse({
    active: false,
  });

  response.cookies.set(
    getOwnerModeClearCookieSettings({
      secure: shouldUseSecureOwnerCookie(req),
    })
  );

  logAccessAudit({
    event: 'access_unlock_cleared',
    mode: 'owner',
    request: req,
    reason: 'cookie_cleared',
  });

  return response;
}
