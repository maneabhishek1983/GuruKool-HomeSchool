---
description: Run type-check, lint, and unit tests before pushing. Creates .claude/.preflight-ok marker that unlocks git push (valid 30 min).
---

Run the following checks sequentially. Stop on first failure and report which step failed.

1. `npm run type-check`
2. `npm run lint`
3. `npm test -- --passWithNoTests --silent`

If all three pass, create the marker file `.claude/.preflight-ok` (touch it so the gate-git-push hook accepts the next push). Then report: "Preflight passed. git push unlocked for 30 min."

If any step fails, do NOT create the marker. Report the failing step and the first ~20 lines of error output.
