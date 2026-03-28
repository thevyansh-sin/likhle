import { NextResponse } from 'next/server';
import {
  ACCESS_STATUS_MAX_REQUESTS,
  consumeAccessRouteRateLimit,
  createLockedAccessResponse,
  logAccessAudit,
} from '../../lib/access-route-security';
import { getStyleProfile, getStyleDNA } from '../generate/style-memory';
import {
  ensureAnonymousSession,
  getAnonymousSessionCookieSettings,
  shouldUseSecureAnonymousSessionCookie,
} from '../../lib/anonymous-session';

export async function GET(request) {
  const rateLimit = await consumeAccessRouteRateLimit(request, {
    mode: 'style_memory',
    scope: 'style-dna:get',
    maxRequests: ACCESS_STATUS_MAX_REQUESTS,
  });

  if (rateLimit.locked) {
    return createLockedAccessResponse();
  }

  const anonymousSession = ensureAnonymousSession(request);

  try {
    const profile = await getStyleProfile(anonymousSession.sessionId);
    const dna = getStyleDNA(profile);
    const response = NextResponse.json({ dna: dna || null });

    if (anonymousSession.shouldSetCookie && anonymousSession.cookieValue) {
      response.cookies.set(
        getAnonymousSessionCookieSettings({
          value: anonymousSession.cookieValue,
          expiresAt: anonymousSession.expiresAt,
          secure: shouldUseSecureAnonymousSessionCookie(request),
        })
      );
    }

    return response;
  } catch (error) {
    logAccessAudit({
      event: 'style_dna_fetch_error',
      mode: 'style_memory',
      request,
      outcome: 'warn',
      reason: 'backend_error',
    });
    console.error('Style DNA fetch error:', error);
    return Response.json({ error: 'Failed to fetch style DNA' }, { status: 500 });
  }
}
