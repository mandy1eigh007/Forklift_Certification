# Editing workflow (so Copilot doesn’t wreck the manual)

## Golden rule
- Do **not** change the wording inside: `<!-- GENIE CONTENT (DO NOT EDIT WORDING; layout ok) -->`
- Put all Class 1–5 additions inside: `<!-- CLASS 1–5 ADDITIONS (EDIT OK) -->`

## Recommended Copilot prompt (copy/paste)
You are editing `index.html` for a two-column training manual:
- Left column (`genie-col`) must keep the existing wording unchanged.
- Right column (`forklift-col`) is where Class 1–5 forklift inserts live.
- Only make the requested change. Do not do global find/replace. Do not add <mark> tags.
- Keep the HTML valid and keep printing to PDF working.

## Local preview
From the repo root:
- `python3 -m http.server 8000`
- Open the forwarded port and load `/`
