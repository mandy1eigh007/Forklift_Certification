# Codex Session Guardrails

Before making any code changes:
1) Open `docs/WORKLOG.md` and read the last entry.
2) Summarize "where we left off" in 5 bullets.
3) Continue from the `NEXT:` section.

After any change:
- Append a new entry to `docs/WORKLOG.md` using the template at the top.

At the end of the session, update `docs/STATE.json` to reflect:
- `current_goal`
- `open_issues`
- `next_actions`
- `last_known_working_commit` (if build passes)

After completing a coherent unit of work (even if small):
- Run: `git status`
- Run: `npm run typecheck && npm run build`
- If both pass, create a commit with message:
  - `run-of-show: <short description>`
- Append commit hash to `docs/WORKLOG.md` and `docs/STATE.json`.

If you don’t want Codex committing automatically, Codex must still output the exact commit command and message.

Recovery command:
- Run `bash scripts/whereami.sh`

Reconnect prompt:
We lost chat context. Do NOT guess.

1) Run `scripts/whereami.sh` and summarize:
   - current branch
   - last commit
   - uncommitted changes
   - last WORKLOG entry
   - STATE.json `current_goal` + `next_actions`
2) Propose the next smallest safe step.
3) Implement only that step, then update WORKLOG and STATE.
