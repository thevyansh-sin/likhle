import { NextResponse } from 'next/server';
import {
  createAdminModeSession,
  getAdminModeClearCookieSettings,
  getAdminModeCookieSettings,
  hasMatchingAdminSecret,
  isAdminModeConfigured,
  shouldUseSecureAdminCookie,
} from '../../../lib/owner-mode';

function createNoStoreJsonResponse(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(req) {
  if (!isAdminModeConfigured()) {
    return createNoStoreJsonResponse(
      {
        error: 'Admin mode is not configured on this deployment yet.',
      },
      { status: 503 }
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return createNoStoreJsonResponse(
      {
        error: 'Secret required.',
      },
      { status: 400 }
    );
  }

  if (!hasMatchingAdminSecret(body?.secret)) {
    return createNoStoreJsonResponse(
      {
        error: 'That admin secret did not match.',
      },
      { status: 401 }
    );
  }

  const adminModeSession = createAdminModeSession();
  const response = createNoStoreJsonResponse({
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

  return response;
}

export async function DELETE(req) {
  const response = createNoStoreJsonResponse({
    active: false,
  });

  response.cookies.set(
    getAdminModeClearCookieSettings({
      secure: shouldUseSecureAdminCookie(req),
    })
  );

  return response;
}
