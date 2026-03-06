# Work Log (Codex)

Rules:
- Every time you change files, append an entry.
- Each entry must include: timestamp, goal, files changed, key decisions, commands run, results, and next steps.
- If you stop mid-task, end with “NEXT:” bullets.

Template:
## YYYY-MM-DD HH:MM (local)
Goal:
Files changed:
Decisions:
Commands:
Results:
NEXT:

## 2026-03-06 15:57 (local)
Goal:
- Add persistent work logging + state snapshot + recovery script.
Files changed:
- docs/WORKLOG.md
- docs/STATE.json
- scripts/whereami.sh
- .github/copilot-instructions.md
Decisions:
- Use `.github/copilot-instructions.md` as the repo-level place to “force” the agent to maintain WORKLOG/STATE.
- Keep `docs/STATE.json` conservative (no claimed “last known working commit” until build checks pass).
Commands:
- date '+%Y-%m-%d %H:%M'
- git rev-parse --abbrev-ref HEAD
- git rev-parse HEAD
Results:
- Added WORKLOG, STATE snapshot, and `whereami` recovery script.
- Added repo instructions to standardize session start/end behavior.
NEXT:
- Run `bash scripts/whereami.sh` once to verify output looks right.
- Decide whether you want automatic checkpoint commits; if yes, follow the instructions in `.github/copilot-instructions.md`.

## 2026-03-06 15:58 (local)
Goal:
- Make recovery script executable and verify output.
Files changed:
- scripts/whereami.sh
Decisions:
- Track `whereami.sh` as an executable script (chmod +x).
Commands:
- chmod +x scripts/whereami.sh
- git status -sb
- bash scripts/whereami.sh
Results:
- `bash scripts/whereami.sh` prints git status, recent commits, WORKLOG tail, and STATE.
NEXT:
- If you want a checkpoint commit for just these workflow files, stage only `.github/`, `docs/`, and `scripts/` and commit.

## 2026-03-06 15:59 (local)
Goal:
- Align persistent workflow files to the exact recovery/checkpoint process request.
Files changed:
- .github/copilot-instructions.md
- docs/STATE.json
- docs/WORKLOG.md
Decisions:
- Keep enforcement instructions in `.github/copilot-instructions.md` so Codex reads them every session in this repo.
- Use the requested Run-of-Show hardening issues/actions as the machine-friendly default in `docs/STATE.json`.
Commands:
- sed -n '1,220p' docs/STATE.json
- sed -n '1,220p' scripts/whereami.sh
- sed -n '1,260p' .github/copilot-instructions.md
- git status -sb
- git rev-parse --abbrev-ref HEAD
- date '+%Y-%m-%d %H:%M'
Results:
- Repo instructions now encode the start-of-session, after-change logging, checkpoint commit, and reconnect workflow.
- `docs/STATE.json` now follows the requested schema/content for current goal, open issues, and next actions.
NEXT:
- Run `bash scripts/whereami.sh` at session start and continue from `docs/STATE.json` `next_actions`.
- After next coherent code unit: run `git status` and `npm run typecheck && npm run build`, then checkpoint commit if green.
