# Run-of-Show (Instructor Only)

Projector-first static web app for instructor-led delivery.

## Requirements

- Node.js 20+ (includes npm)
- Git

## Tech Stack

- Vite + TypeScript (`vanilla-ts` style app, no React)
- Plain CSS
- Fuse.js for search
- Hash routing (`#/...`) for GitHub Pages compatibility

## Routes

- `#/` Library/Search
- `#/present?scene=<id>` Projected Present view
- `#/control?scene=<id>` Instructor Console

## Local Setup

```bash
cd run-of-show
npm install
npm run dev
```

Open these in separate tabs/windows:

- `http://localhost:5173/Forklift_Certification/#/`
- `http://localhost:5173/Forklift_Certification/#/present?scene=s01`
- `http://localhost:5173/Forklift_Certification/#/control?scene=s01`

## Present + Console Sync

Open `#/present` and `#/control` at the same origin.
Scene and control updates sync through:

- `BroadcastChannel("runofshow")` (primary)
- `localStorage` `storage` event (fallback)

## Keyboard Shortcuts (Present)

- `Right` / `Space`: next scene
- `Left`: previous scene
- `B`: black screen overlay
- `F`: toggle fullscreen
- `+` / `-`: font size
- `T`: start/pause timer
- `R`: reset timer
- `/`: scene picker

## Build and Preview

```bash
npm run build
npm run preview
```

## Extract Attachment Images

To replace placeholder visual assets with real telehandler attachment images:

```bash
python3 scripts/extract_telehandler_attachment_images.py \
  --pdf "sources/genie/2025 Genie Lift Pro Telehandler Trainer's Guide.pdf" \
  --scale 3 \
  --page quick-attach=120 \
  --page rotating-carriage=122 \
  --page swing-carriage=123 \
  --page overview=121
```

Notes:

- Script path: `scripts/extract_telehandler_attachment_images.py`
- Output path: `run-of-show/public/media/telehandler/attachments/*.png`
- If `fitz` import fails, install PyMuPDF: `pip install pymupdf`

After extraction, ensure image sources in `run-of-show/public/content/outline.json` point to the generated `.png` files.

## GitHub Pages Deployment

Vite base path is configured in `vite.config.ts`:

- `base: "/Forklift_Certification/"`

GitHub Actions workflow is at:

- `../.github/workflows/deploy.yml` (repo root)

Deploy steps:

1. Push to `main`.
2. In repository settings, set Pages source to **GitHub Actions**.
3. Workflow builds `run-of-show/dist` and deploys to Pages.

## Security Warning

GitHub Pages is static hosting, not true access control.
Treat published content as public. Do not place sensitive or private material in this app.
