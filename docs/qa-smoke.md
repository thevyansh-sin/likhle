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

Run the long-running real-provider stress sweep:

```powershell
npm run stress:generate
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

## Long-running generator stress runner

Use this when you want to test the real `/api/generate` path against slow or unstable upstream AI responses.

Recommended flow:

1. Start the app locally:

```powershell
npm run dev:qa
```

2. In another terminal, run the stress sweep:

```powershell
npm run stress:generate
```

Optional owner-mode unlock for local QA:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stress-generate.ps1 `
  -BaseUrl "http://127.0.0.1:3001" `
  -Iterations 30 `
  -OwnerSecret "your-owner-secret"
```

What it does:

- uses `curl.exe` instead of the Node fetch harness
- cycles through multiple generator presets
- records per-run status, total time, response body, and headers
- saves outputs under `test-results/stress/`

If you only want to validate the script wiring without hitting the app, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stress-generate.ps1 -Iterations 0
```
