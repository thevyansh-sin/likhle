import { NextResponse } from 'next/server';

function createNonce() {
  return btoa(crypto.randomUUID());
}

function buildContentSecurityPolicy({ nonce, enforceHttpsUpgrade = false }) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];

  if (enforceHttpsUpgrade) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

function isSensitivePath(pathname) {
  return (
    pathname === '/owner/unlock' ||
    pathname === '/admin/unlock' ||
    pathname === '/api/generate' ||
    pathname === '/api/style-dna' ||
    pathname.startsWith('/api/owner/') ||
    pathname.startsWith('/api/admin/')
  );
}

export function proxy(request) {
  const requestHeaders = new Headers(request.headers);
  const nonce = createNonce();
  requestHeaders.set('x-csp-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const isHttps = forwardedProto
    ? forwardedProto === 'https'
    : request.nextUrl.protocol === 'https:';
  const isLocalhost = ['localhost', '127.0.0.1'].includes(request.nextUrl.hostname);
  const csp = buildContentSecurityPolicy({
    nonce,
    enforceHttpsUpgrade: isHttps && !isLocalhost,
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()'
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (isHttps && !isLocalhost) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (isSensitivePath(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'no-store, private, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', 'Cookie');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
