# Recent Changes

## Purpose
Use this file as a quick human-readable memory of meaningful recent project changes.

## Current Snapshot
- Public version is `v0.2.27`.
- Generator quick-start templates now trigger generation correctly instead of only prefilling the prompt.
- Owner mode unlock delete flow no longer crashes, and owner cookies now use the secure flag correctly on HTTPS requests.
- Owner mode was added for the owner's browser with a signed cookie unlock flow.
- Workflow docs were added to make repo work faster and cleaner.
- `docs/` source-of-truth files now exist for cross-thread consistency.
- Thread read order and known-risk files now exist to help other threads start with the right context faster.
- A release-post exporter now exists for socials automation and saves branded assets into `social-assets/releases/`.
- A local Meta / Instagram Graph API MCP server now exists for safer Codex-side posting workflows.
- A local OpenAI media MCP server now exists for image generation and Sora video workflows.
- QA tooling now includes a Playwright smoke suite, stable smoke server bootstrap, and local dev-origin support for both `localhost` and `127.0.0.1`.

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
