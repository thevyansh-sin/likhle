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
- Current public version: `v0.3.4`

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
- Owner mode helpers: `app/lib/owner-mode.js`
- PWA/service worker: `public/sw.js`

## Environment Variables
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `OWNER_MODE_TOKEN`

## Workflow Rules
- Meaningful live website changes should usually bump the public version.
- Future ideas should go into `later upgrades/`.
- This repo has a public footer version, so version updates should stay intentional.
- Owner mode exists for the owner's browser and should not be removed casually.

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

## Notes
- If a future idea is not for immediate implementation, save it in `later upgrades/`.
- If a bug is reported from another thread, fix it here and keep the code solution clean.
