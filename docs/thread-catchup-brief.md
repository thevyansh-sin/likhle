# Thread Catch-Up Brief

Use this file when any thread needs a fast sync on what changed while it was inactive.

## Current Public State
- Public version: `v0.6.2`
- Core brand is still the same Likhle:
  - premium
  - dark
  - controlled lime
  - India-native
  - useful and confident

## Big Website Changes Other Threads Should Know

### 1. Homepage and generator tone moved back toward Likhle's stronger India-native voice
- The homepage and `/generate` no longer lean as hard into the calmer repositioned copy only.
- The product voice is now more Hinglish-first and more recognizably Likhle again.
- The homepage currently uses:
  - rotating hero word
  - `What changed` framing
  - stronger Gen Z India language
- The generator intro also returned to a simpler `Kya likhna hai?` style.

This matters for:
- `branding and design`
- `socials`
- `upgrades strategy`

### 2. Generator reliability and provider handling improved
- Single-result generation no longer overgenerates extra review candidates.
- Hashtag fallback is safer and less awkward than before.
- Provider faults are handled more clearly:
  - quota
  - timeout
  - DNS/network
  - unstable upstream
- Empty model output already returns an error instead of a blank success state.

This matters for:
- `website bugs and testing`
- `upgrades strategy`
- `socials` if they are planning around real output quality

### 3. Owner mode and admin mode now both exist
- `owner mode`
  - owner browser only
  - longer signed session
- `admin mode`
  - separate trusted tester browser flow
  - separate secret
  - 10-day signed session
- Both skip Likhle's own app-side testing waits.
- Neither skips external provider quota pauses.

This matters for:
- `website bugs and testing`
- `coding`

### 4. Social and media tooling is much stronger now
- Release-post exporter exists for branded social release visuals.
- Local Meta / Instagram Graph API MCP exists.
- Local OpenAI media MCP exists for image generation and Sora video flows.

This matters for:
- `socials`
- `upgrades strategy`

### 5. QA and stress tooling improved
- Playwright smoke suite exists.
- Long-running `curl.exe` stress runner exists for real `/api/generate`.
- k6 load scripts also exist in the repo now.
- Local QA server flow supports both:
  - `localhost`
  - `127.0.0.1`

This matters for:
- `website bugs and testing`
- `upgrades strategy`

### 6. Repo process is more structured now
- Separate thread lanes exist for:
  - coding
  - website bugs and testing
  - branding and design
  - socials
  - upgrades strategy
- `later upgrades/` is the place for future ideas worth saving.

This matters for:
- all threads

## Thread-Specific Catch-Up

### Branding And Design
You should assume:
- homepage is the strongest benchmark surface
- secondary pages were polished to feel closer to homepage quality
- but homepage/generator copy direction has since shifted back toward a more clearly Likhle voice
- do not accidentally review using outdated calmer-only assumptions

### Website Bugs And Testing
You should assume:
- owner and admin unlock flows both exist
- `/api/version` exists
- smoke, stress, and load-testing support exist
- generator error handling is stronger than the older blank/dead-state versions

### Socials
You should assume:
- site tone is more Hinglish-forward again
- Instagram publishing tooling exists locally through MCP
- OpenAI image / Sora tooling exists locally through MCP
- release assets can be generated from the repo now

### Upgrades Strategy
You should assume:
- the project is past the "basic landing page + generator" stage
- the next ideas should consider:
  - stronger product quality
  - publishing workflows
  - trust/safety
  - infra/scale
  - creator-facing polish
instead of repeating already-solved basics

## If You Need More Detail
Then read:
1. `docs/recent-changes.md`
2. `docs/likhle-master-context.md`
3. `docs/brand-rules.md`
