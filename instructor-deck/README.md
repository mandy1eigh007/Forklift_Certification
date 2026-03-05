# Instructor Deck

## Run Locally

```bash
cd /workspaces/Forklift_Certification/instructor-deck/deck
python3 -m http.server
```

Open presenter launcher:

```bash
$BROWSER http://127.0.0.1:8000/present.html
```

### Full Screen

- In the deck window, press `F` to enter/exit reveal.js full screen mode.
- For browser-level full screen, press `F11`.

## Build Commands

```bash
cd /workspaces/Forklift_Certification/instructor-deck/deck
python3 build.py
```

Optional sync from image sequence (`assets/pages` then fallback `assets/pics`):

```bash
python3 build.py sync-pages
```
