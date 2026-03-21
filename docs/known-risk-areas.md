# Known Risk Areas

Use this file mainly in the `website bugs and testing` thread.

## Generator / AI Risks
- External provider quota and rate-limit pauses can still happen.
- Weird edge-case prompts can still expose weak output paths.
- AI responses are structured and validated, but malformed output is always a risk zone.

## Caching / Refresh Risks
- Service worker or browser cache can sometimes keep old UI behavior until a hard refresh.
- After cache-related changes, a hard refresh may still be needed: `Ctrl + Shift + R`

## Owner Mode
- Owner mode should only affect the unlocked owner browser.
- If owner mode behavior looks wrong, verify:
  - env token exists
  - unlock route works
  - owner cookie is set

## Visual / UX Risk Areas
- Generator result rendering and loading states are sensitive because they are highly dynamic.
- Profile-grid style social exports are safe only when content stays inside a square-safe area.

## Process Risks
- Repo/workflow docs are split across multiple files now, so the right thread should read the right file first.

## Current Reminder
- The site is in a stronger state, but it should still be treated as a live product under observation, not a guaranteed bug-free system.
