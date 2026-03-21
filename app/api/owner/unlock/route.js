import { NextResponse } from 'next/server';
import {
  createOwnerModeSession,
  getOwnerModeClearCookieSettings,
  getOwnerModeCookieSettings,
  hasMatchingOwnerSecret,
  isOwnerModeConfigured,
  shouldUseSecureOwnerCookie,
} from '../../../lib/owner-mode';

function createNoStoreJsonResponse(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(req) {
  if (!isOwnerModeConfigured()) {
    return createNoStoreJsonResponse(
      {
        error: 'Owner mode is not configured on this deployment yet.',
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

  if (!hasMatchingOwnerSecret(body?.secret)) {
    return createNoStoreJsonResponse(
      {
        error: 'That owner secret did not match.',
      },
      { status: 401 }
    );
  }

  const ownerModeSession = createOwnerModeSession();
  const response = createNoStoreJsonResponse({
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

  return response;
}

export async function DELETE() {
  const response = createNoStoreJsonResponse({
    active: false,
  });

  response.cookies.set(
    getOwnerModeClearCookieSettings({
      secure: shouldUseSecureOwnerCookie(req),
    })
  );

  return response;
}
