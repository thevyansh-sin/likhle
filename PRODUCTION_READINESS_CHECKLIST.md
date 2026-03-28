# Likhle Production Readiness Checklist

Use this before each release. Keep it short, practical, and tied to the current security/performance protections.

## Security checks before release
- [ ] `npm run lint` passes without new security-related warnings.
- [ ] `npm run build` passes.
- [ ] `SMOKE_SKIP_BUILD=1 npm run smoke` passes locally.
- [ ] Admin and owner unlock paths still fail closed for wrong secrets.
- [ ] Privileged cookies remain `httpOnly`, `secure` on HTTPS, and `sameSite=strict`.
- [ ] Sensitive responses stay `no-store, private`.

## Deployed smoke checks
- [ ] Homepage loads.
- [ ] `/generate` loads and submits a normal request successfully.
- [ ] Quick-start template still prefills and generates.
- [ ] Regenerate and rewrite actions still work.
- [ ] Owner/admin unlock pages still open and lock back down correctly.

## Rate-limit / lockout checks
- [ ] `/api/generate` allows requests below threshold.
- [ ] The 9th request within 60 seconds triggers the 5-minute lockout.
- [ ] Lockout responses return `429` with `Retry-After: 300`.
- [ ] Owner/admin unlock repeated failures still lock out as expected.
- [ ] Status routes still rate-limit repeated probing.

## Provider smoke checks
- [ ] Provider budget exhaustion still returns the safe failure response.
- [ ] Long upstream provider stalls still fail safely instead of hanging.
- [ ] Transient provider/network failures still recover or degrade safely.

## Headers / cookie checks
- [ ] CSP is present and blocks unexpected script/frame sources.
- [ ] `X-Content-Type-Options: nosniff` is present.
- [ ] `Referrer-Policy` is present and restrictive.
- [ ] `X-Frame-Options: DENY` or equivalent frame protection is present.
- [ ] Sensitive routes still set `Cache-Control: no-store, private`.
- [ ] Owner/admin cookies are not readable by client JavaScript.

## Redis / style-memory checks
- [ ] Style-memory still uses the server-trusted anonymous session.
- [ ] Anonymous session and style-memory cookies still work after refresh.
- [ ] Style/profile reads do not expose raw session identifiers.
- [ ] Redis-backed style-memory records still respect TTL/retention.
- [ ] Clearing site cookies/site data still severs the anonymous style-memory link.

## What to monitor after deployment
- [ ] `access-audit` logs for lockouts, unlock failures, and tampered-cookie events.
- [ ] `429` spikes on `/api/generate`, `/api/owner/*`, `/api/admin/*`, and `/api/style-dna`.
- [ ] `500` / `502` / provider timeout spikes from generation.
- [ ] Unexpected cache-header regressions on sensitive routes.
- [ ] Any sudden increase in provider budget exhaustion or Redis errors.
