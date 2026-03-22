# QA Smoke Workflow

Use this lane for repeatable browser QA without depending on live AI providers or manual browser state.

## What it covers

- homepage load
- `/generate` load
- quick-start template click -> prefill -> auto-generate
- normal generator submit
- regenerate single result
- rewrite action flow
- invalid image upload validation
- owner unlock / lock flow
- key static/meta endpoints:
  - `/manifest.webmanifest`
  - `/robots.txt`
  - `/sitemap.xml`

## Commands

Install the dedicated browser once:

```powershell
npm run smoke:install
```

Run the full smoke suite:

```powershell
npm run smoke
```

Run it in a visible browser:

```powershell
npm run smoke:headed
```

## Stable local QA server

For manual browser QA in development, use:

```powershell
npm run dev:qa
```

Then open either:

- `http://localhost:3001`
- `http://127.0.0.1:3001`

`allowedDevOrigins` is configured so both hosts work cleanly during local QA.

## Reliability notes

- The smoke suite mocks `/api/generate` so quota pressure from Groq/Gemini does not break regression checks.
- Owner unlock uses a dedicated local fallback secret if `OWNER_MODE_TOKEN` is not set.
- The smoke web server builds and starts a clean local app instance automatically.
- Results, traces, and failure media go under `test-results/`.
