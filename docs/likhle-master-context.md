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
- Current public version: `v0.3.6`

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
- Owner mode logic: `app/lib/owner-mode.js`
- PWA/service worker: `public/sw.js`

## Environment Variables
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `OWNER_MODE_TOKEN`
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_USER_ID`
- `META_APP_ID`
- `META_APP_SECRET`
- `OPENAI_API_KEY`

## Workflow Rules
- Meaningful live website changes should usually bump the public version.
- Future ideas should go into `later upgrades/`.
- Version changes should stay intentional because the footer shows the public version.
- Owner mode exists and should not be removed casually.

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

## Current Working Rule
- In the coding thread:
  - do the code work
  - commit it
  - push it
  - redirect non-coding work to the correct thread
