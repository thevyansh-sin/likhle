# Likhle Master Context

## Product
- `Likhle` is an AI writing tool for Gen Z India.
- It helps users generate:
  - Instagram captions
  - Instagram bios
  - Reels hooks
  - WhatsApp statuses
  - LinkedIn bios
  - Twitter/X bios
  - Hinglish content

## Public Identity
- Brand name: `Likhle`
- Live URL: `https://likhle.vercel.app`
- Support email: `likhlesupport@gmail.com`
- Instagram handle: `@likhle.in`
- Current public version: `v0.6.8`

## Tech Stack
- Next.js 16 App Router
- React 19
- CSS in `app/globals.css`
- Groq for text generation
- Gemini for image understanding

## Key App Files
- Homepage: `app/page.js`
- Generator page: `app/generate/page.js`
- Main API route: `app/api/generate/route.js`
- Shared site config: `app/lib/site.js`
- Owner/admin access mode logic: `app/lib/owner-mode.js`
- PWA/service worker: `public/sw.js`

## Environment Variables
- Private server env:
  - `GROQ_API_KEY`
  - `GEMINI_API_KEY`
  - `ANONYMOUS_SESSION_SIGNING_SECRET` (optional explicit override)
  - `OWNER_MODE_TOKEN`
  - `ADMIN_MODE_TOKEN`
  - `INSTAGRAM_ACCESS_TOKEN`
  - `INSTAGRAM_USER_ID`
  - `META_APP_ID`
  - `META_APP_SECRET`
  - `OPENAI_API_KEY`
- Public env:
  - `NEXT_PUBLIC_SITE_URL`

## Workflow Rules
- Meaningful live website changes should usually bump the public version.
- Future ideas should go into `later upgrades/`.
- Version changes should stay intentional because the footer shows the public version.
- Owner mode exists for the owner's browser and should not be removed casually.
- Admin mode exists for one trusted tester browser and should stay separate from owner mode.
- Owner/admin unlock and status flows are server-trusted only and should not expose configuration state, raw secret hints, or client-side bypasses.
- App-side secret/config access should stay inside the dedicated server-only env layer in `lib/env.js`.
- User-controlled payloads, query strings, local browser cache/state, and generated text should stay validated and rendered as plain text unless a strict sanitizer/allowlist is explicitly introduced.
- Anonymous style-memory must stay bound to the signed server-trusted session cookie, not a client-provided localStorage/query identifier.
- Security headers and CSP should stay centralized and nonce-based so theme init, analytics, and JSON-LD remain allowed without reopening broad inline-script risk.
- Dependency updates should stay surgical, audited, and compatible with the current Next 16 line; use targeted overrides for vulnerable transitives instead of broad churn when possible.

## Thread Split
- `coding`
  - code
  - commit
  - push
- `website bugs and testing`
  - testing
  - bug reports
  - server/debug feedback
- `branding and design`
  - visual direction
  - design reviews
  - concepts
- `socials`
  - posts
  - reels
  - launch content
- `upgrades strategy`
  - future upgrades
  - roadmap thinking
  - what to add later
  - priority planning

## Current Working Rule
- In the coding thread:
  - do the code work
  - commit it
  - push it
  - redirect non-coding work to the correct thread
