# Project Context

## Product
- `Likhle` is an AI writing tool for Gen Z India.
- Main use cases:
  - Instagram captions
  - Instagram bios
  - Reels hooks
  - WhatsApp statuses
  - LinkedIn bios
  - Twitter/X bios
  - Hinglish content

## Current Public Identity
- Brand name: `Likhle`
- Live URL: `https://likhle.vercel.app`
- Support email: `likhlesupport@gmail.com`
- Instagram: `@likhle.in`
- Current public version: v0.6.8

## Core Brand Rules
- Keep the site premium, sharp, dark, and modern.
- Avoid generic startup visuals, cheap gradients, and playful clutter.
- Lime accent should feel controlled, not loud.
- The site should feel built for Gen Z India, not like a global generic AI tool.
- Preserve the current visual language unless a redesign is explicitly requested.

## Tech Stack
- Next.js 16 App Router
- React 19
- CSS in `app/globals.css`
- Groq for text generation
- Gemini for image understanding

## Important App Areas
- Homepage: `app/page.js`
- Generator page: `app/generate/page.js`
- Main API route: `app/api/generate/route.js`
- Shared site config: `app/lib/site.js`
- Owner/admin access helpers: `app/lib/owner-mode.js`
- PWA/service worker: `public/sw.js`

## Environment Variables
- Private server env:
  - `GROQ_API_KEY`
  - `GEMINI_API_KEY`
  - `ANONYMOUS_SESSION_SIGNING_SECRET` (optional explicit override)
  - `OWNER_MODE_TOKEN`
  - `ADMIN_MODE_TOKEN`
- Public env:
  - `NEXT_PUBLIC_SITE_URL`

## Workflow Rules
- Meaningful live website changes should usually bump the public version.
- Future ideas should go into `later upgrades/`.
- This repo has a public footer version, so version updates should stay intentional.
- Owner mode exists for the owner's browser and should not be removed casually.
- Admin mode exists for one trusted tester browser and should stay separate from owner mode.
- Owner/admin access must stay server-verified through signed cookies and must not depend on client-side flags, localStorage, query params, or hidden-route assumptions.
- App-side env access should stay centralized in `lib/env.js` for private config and `lib/public-env.js` for safe public config.
- Untrusted input should fail closed at the route boundary and generated/user text should stay plain-text rendered unless a strict sanitizer is intentionally introduced.
- Style-memory identity must stay server-trusted and cookie-bound, not controlled through localStorage or query params.
- Browser security headers and CSP should stay centralized, restrictive, and compatible with the existing nonce-based theme/analytics/JSON-LD script model.
- Dependency upgrades should stay surgical and audited; prefer compatible patch bumps and targeted `overrides` for transitive vulnerabilities over broad package churn.

## Current Collaboration Split
- `coding` thread:
  - code
  - commit
  - push
- `website bugs and testing` thread:
  - testing
  - bug reports
  - server/debug feedback
- `branding and design` thread:
  - visual direction
  - design reviews
  - concepts
- `socials` thread:
  - posts
  - reels
  - launch content
- `upgrades strategy` thread:
  - future upgrades
  - roadmap thinking
  - what to add later
  - priority planning

## Notes
- If a future idea is not for immediate implementation, save it in `later upgrades/`.
- If a bug is reported from another thread, fix it here and keep the code solution clean.
