# Recent Changes (likhle v0.6.9)

## Purpose
Use this file as a quick human-readable memory of meaningful recent project changes.

## Current Snapshot
- Public version is `v0.6.9`.
- Homepage refinement pass shipped with a sharper creator-specific hero, more believable above-the-fold proof, a more grounded Likhle-style demo card, outcome-led `What changed` tiles, more intentional generator/idea lanes, and a cleaner final CTA while keeping the existing homepage structure and premium dark identity intact.
- Package supply-chain hardening removed the unused top-level `node-fetch` runtime dependency, bumped a small set of compatible top-level packages, and added targeted overrides for previously vulnerable transitive packages.
- `npm audit` is back to zero findings after pinning safe transitive versions for `path-to-regexp`, `picomatch`, and `brace-expansion` instead of doing a broad dependency churn.
- Security headers are now centralized in middleware with a nonce-based CSP, hard frame blocking, nosniff, stricter referrer policy, and a restrictive permissions policy instead of relying on scattered defaults.
- Theme init, Google Analytics bootstrap, and JSON-LD scripts now run under request-scoped CSP nonces, so the app keeps its current behavior without reopening broad inline-script execution.
- Sensitive owner/admin unlock/status routes plus `/api/generate` and `/api/style-dna` now carry explicit no-store cache headers from the shared header layer to reduce browser/proxy caching risk.
- Style-memory identity is now bound to a signed, httpOnly anonymous session cookie instead of a client-controlled `sessionKey`, so another browser cannot fetch or poison the same profile just by changing local state or query params.
- Anonymous style-memory reads are now rate-limited, Redis profile keys are derived from hashed session identifiers, and style-memory records now expire after about 14 days instead of lingering indefinitely.
- Generator local history and favorites remain browser-local only, while server-side style-memory is now explicitly separated from that local storage model.
- Input handling is now stricter across sensitive routes: `/api/generate`, owner/admin unlock, and `/api/style-dna` all fail closed on malformed payloads or unknown fields instead of loosely normalizing bad input.
- Generator local history, favorites, session keys, streamed partial output, and query-prefill state are now sanitized and bounded before entering UI state, so malformed local/browser data cannot poison the page state as easily.
- JSON-LD script serialization now escapes unsafe characters before inline injection, reducing the chance of accidental script-breakout if future structured-data content ever becomes less trusted.
- Sensitive app config now flows through a dedicated server-only env module, so GROQ/Gemini/Upstash/access-mode secrets are validated in one place and no longer rely on scattered direct `process.env` reads in app code.
- Public site URL config now uses a separate safe public-config module, and Playwright smoke unlock secrets now use isolated ephemeral values instead of hardcoded fallback test secrets.
- Owner/admin unlock and status flows now use stricter server-side enforcement only: generic responses, route-specific abuse lockouts, tamper-aware signed cookie verification, and audit logging for unlock failures, lockouts, and invalid privileged-cookie use.
- Repo workflow now includes an `upgrades strategy` thread lane with shared read-order docs and a pinned prompt file so long-term planning stays aligned with coding, testing, branding, and socials.
- Shared repo memory now also includes a cross-thread catch-up brief and current-state snapshot so inactive threads can re-sync before reviewing, planning, or testing.
- Trusted tester browsers can now use a separate admin-mode unlock with its own secret and a 10-day signed cookie instead of sharing the owner-mode secret.
- Local Instagram container-status polling now uses the fields Meta currently accepts, so post flows no longer break on the deprecated `error_message` lookup during readiness checks.
- Local Instagram validation now uses the fields Meta currently accepts for the connected Instagram business account lookup, so a valid token/IG user pair no longer fails on the deprecated `account_type` field.
- Homepage `What changed` now stays tighter at 6 feature tiles in a 3x2 desktop grid, and the hero proof/demo labels now carry proper supporting text instead of reading like empty placeholders.
- Homepage and `/generate` now restore the older Likhle personality and format from the pre-repositioning direction, including the rotating-word homepage hero, the `What changed` framing, and the simpler `Kya likhna hai?` generator intro while keeping the later functional fixes and QA-safe polish.
- Homepage and generator copy now lean back into a stronger Hinglish-first voice across the hero, nav, proof labels, loading/empty states, and key actions so Likhle sounds more Gen Z India again without losing the premium polish.
- Design consistency pass brought generator, SEO pages, idea pages, and info pages closer to the homepage benchmark through tighter card rhythm, calmer hierarchy, more premium CTA treatment, and stronger shared nav/footer consistency.
- Generator polish now feels more product-led, with a sharper intro, more cohesive control grouping, a stronger reward state for results, and quieter secondary treatment for saved picks and recent runs.
- Homepage now leads with a sharper brand promise, a calmer product-proof hero, a compact `Why Likhle wins` section, real output examples, and a more product-confident final CTA instead of the older rotating/changelog-style framing.
- Mobile homepage headings now stay display-led, and the homepage section rhythm is less equal-weight and less feature-dump-like.
- Presentation polish pass tightened the homepage promise, unified card/button density, and made generator empty/loading/success/error states feel more premium and consistent across the site.
- Mobile generate results now hide the floating back-to-top control while the results stack is in view, so the first cards and actions stay visually clear.
- Generator quick-start templates now trigger generation correctly instead of only prefilling the prompt.
- Owner mode unlock delete flow no longer crashes, and owner cookies now use the secure flag correctly on HTTPS requests.
- Admin mode now exists alongside owner mode, uses its own hidden unlock page, and skips the same app-side testing waits for one trusted tester browser at a time.
- Single-result generation now returns directly instead of overgenerating extra review candidates, which reduces unnecessary provider usage on `count=1` requests.
- Hashtag fallback generation now uses safer filtered keywords and curated tone/platform labels instead of awkward generated-text word pairs.
- Generator provider handling now distinguishes quota, timeout, network/DNS, and unstable-upstream faults more cleanly instead of collapsing them into a generic failure.
- QA tooling now includes a `curl.exe`-based long-running stress runner for real `/api/generate` sweeps on slow upstream responses.
- Owner mode was added for the owner's browser with a signed cookie unlock flow.
- Workflow docs were added to make repo work faster and cleaner.
- `docs/` source-of-truth files now exist for cross-thread consistency.
- Thread read order and known-risk files now exist to help other threads start with the right context faster.
- A release-post exporter now exists for socials automation and saves branded assets into `social-assets/releases/`.
- A local Meta / Instagram Graph API MCP server now exists for safer Codex-side posting workflows.
- A local OpenAI media MCP server now exists for image generation and Sora video workflows.
- QA tooling now includes a Playwright smoke suite, stable smoke server bootstrap, and local dev-origin support for both `localhost` and `127.0.0.1`.
- Local app stability fixes now include:
  - template-triggered generation using the template's own override context
  - owner unlock `DELETE` accepting the request object cleanly
  - owner cookies using HTTPS-aware secure detection
  - single-result generate/rewrite flows avoiding unnecessary quality-candidate expansion

## Recent Repo Process Additions
- Added `PROJECT_CONTEXT.md`
- Added `RELEASE_CHECKLIST.md`
- Added `THREAD_RULES.md`
- Added `THREAD_STARTERS.md`
- Added `docs/likhle-master-context.md`
- Added `docs/brand-rules.md`
- Added `docs/recent-changes.md`
- Added `docs/thread-read-order.md`
- Added `docs/known-risk-areas.md`
- Added `docs/qa-smoke.md`

## Notes
- `later upgrades/` should be used for ideas that are not for immediate implementation.
- Public version bumps should be reserved for meaningful live website changes.
