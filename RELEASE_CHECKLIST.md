# Release Checklist

## Before Coding
- Confirm the change is meant for the live website, not just a saved future idea.
- Check whether the task belongs in code or should be saved under `later upgrades/`.
- Avoid changing brand identity casually.

## During Coding
- Keep edits focused on the requested task.
- Preserve existing visual language unless explicitly redesigning.
- Avoid breaking shared systems like:
  - theme
  - version footer
  - PWA/service worker
  - owner mode

## Before Commit
- Review changed files.
- Make sure the solution is complete, not half-finished.
- Run when relevant:
  - `npm run lint`
  - `npm run build`

## Version Rule
- Bump the public version for meaningful live website changes.
- Do not bump the public version for:
  - notes
  - saved ideas
  - repo-only organization files

## Commit And Push Rule
- Use a clean commit message.
- Push after the change is complete.
- Keep the working tree clean after pushing.

## Deploy Notes
- If the change touches caching, PWA, or service worker behavior:
  - update the cache version if needed
  - remind about hard refresh: `Ctrl + Shift + R`
- If the change touches environment variables:
  - mention any required Vercel env updates

## Manual QA Handoff
- Testing and server-side debugging can be handled in the `website bugs and testing` thread.
- If no tests were run, say that clearly.

## Documentation Rule
- Save future/non-immediate ideas in `later upgrades/`.
- Keep `PROJECT_CONTEXT.md` accurate when major project rules change.
