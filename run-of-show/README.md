# Run-of-Show

Static hash-routed instructor app with three views:

- `#/` Library: search and launch scenes.
- `#/present?scene=<id>` Present: projector-safe output.
- `#/control?scene=<id>` Control: instructor console.

## Start

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:5173/#/`
- `http://localhost:5173/#/present?scene=s01`
- `http://localhost:5173/#/control?scene=s01`

## Build

```bash
npm run build
npm run preview
```

## Content Schema

All content is in `content/outline.json`.

- `meta`: app title/version/default scene id.
- `sections[]`: ordered sections.
- `sections[].scenes[]`: scene records with script, prompts, timing, links, media, notes, tags.

## Sync Model

State sync is cross-tab and same-origin only.

- Primary: `BroadcastChannel("runofshow")`
- Fallback: `storage` event payload in `localStorage`

Synced actions:

- scene changes
- black screen toggle
- timer start/pause/reset
- font scale changes

## Keyboard Shortcuts

Present (`#/present`):

- `Space` or `ArrowRight`: next scene
- `ArrowLeft`: previous scene
- `B`: toggle black screen
- `/`: open scene picker
- `F`: request fullscreen

Control (`#/control`):

- `J`: next scene
- `K`: previous scene
- `B`: toggle black screen
- `/`: open scene picker

## Deploy (GitHub Pages)

Workflow file: `.github/workflows/deploy.yml`

Requirements:

- GitHub Pages set to **GitHub Actions** as source.
- Repo default branch `main` (or adjust workflow trigger).

Vite `base` is set to `/Forklift_Certification/` in `vite.config.ts`.

## Security Note

Do not place secrets, private keys, or non-public URLs in `outline.json`.
All content ships to client-side static files and is publicly readable after deployment.
