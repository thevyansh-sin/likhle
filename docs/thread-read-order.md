# Thread Read Order

Use this file to keep all active threads aligned with the same repo memory.

## 1. Coding Thread
Read first:
1. `docs/likhle-master-context.md`
2. `docs/recent-changes.md`
3. `docs/brand-rules.md` if the task touches UI or product presentation

After meaningful repo/workflow changes:
- update `docs/recent-changes.md`

Main job:
- implement
- commit
- push

## 2. Branding And Design Thread
Read first:
1. `docs/brand-rules.md`
2. `docs/likhle-master-context.md`
3. `docs/recent-changes.md` if the work depends on current product state

Main job:
- visual direction
- layout ideas
- design reviews

## 3. Socials Thread
Read first:
1. `docs/brand-rules.md`
2. `docs/likhle-master-context.md`
3. `docs/recent-changes.md`

Main job:
- captions
- reels
- launch content
- tone/voice alignment

## 4. Website Bugs And Testing Thread
Read first:
1. `docs/likhle-master-context.md`
2. `docs/recent-changes.md`
3. `docs/known-risk-areas.md`
4. `docs/bug-report-template.md`

Main job:
- QA
- bug reports
- server/debug feedback
- regression checks

Best report shape:
- what broke
- where it broke
- what was expected
- how to reproduce it
- severity / impact
- can reproduce: always / sometimes / once
- environment: prod / local / preview
- browser / device
- console errors
- network errors
- screenshot if helpful

## 5. Upgrades Strategy Thread
Read first:
1. `docs/likhle-master-context.md`
2. `docs/brand-rules.md`
3. `docs/recent-changes.md`
4. `docs/upgrades-strategy-thread-prompt.md`

Main job:
- future upgrade ideas
- roadmap thinking
- what to add later
- what to remove later
- prioritization

Important rule:
- this thread discusses what should happen later
- confirmed ideas should be saved into `later upgrades/`
- actual implementation should go to the `coding` thread
- bug validation should go to `website bugs and testing`
- pure visual direction should go to `branding and design`
- social rollouts should go to `socials`

## Shared Rule
- If something is for later, save it in `later upgrades/`.
- If a thread does not need a file, skip it.
- If a task changes the live website meaningfully, the coding thread should keep `docs/recent-changes.md` current.
