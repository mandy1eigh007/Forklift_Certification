#!/usr/bin/env python3
"""Build and maintain an offline instructor reveal.js deck.

Source files:
- pages.json: ordered list of slide entries
- notes.md: notes blocks keyed by slide id

Generated file:
- deck.html
"""

from __future__ import annotations

import argparse
import json
import re
from html import escape
from pathlib import Path
from typing import Any

DECK_DIR = Path(__file__).resolve().parent
REPO_ROOT = DECK_DIR.parent.parent
PAGES_JSON = DECK_DIR / "pages.json"
NOTES_MD = DECK_DIR / "notes.md"
OUTPUT_HTML = DECK_DIR / "deck.html"

SCAN_CANDIDATES = (
    REPO_ROOT / "assets" / "pages",
    REPO_ROOT / "assets" / "pics",
)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}


def natural_sort_key(text: str) -> list[Any]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", text)]


def discover_image_dir() -> Path:
    for candidate in SCAN_CANDIDATES:
        if candidate.exists() and any(p.suffix.lower() in IMAGE_EXTENSIONS for p in candidate.iterdir() if p.is_file()):
            return candidate
    raise FileNotFoundError("No image directory found in assets/pages or assets/pics")


def rel_from_deck(path: Path) -> str:
    return Path("..", "..", path.relative_to(REPO_ROOT)).as_posix()


def scan_page_images() -> list[dict[str, Any]]:
    image_dir = discover_image_dir()
    images = sorted(
        [p for p in image_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS],
        key=lambda p: natural_sort_key(p.name),
    )
    pages: list[dict[str, Any]] = []
    for index, image_path in enumerate(images, start=1):
        pages.append(
            {
                "id": f"page-{index:03d}",
                "title": f"Page {index}",
                "type": "page-image",
                "src": rel_from_deck(image_path),
                "tags": ["class7", "class1-5"],
            }
        )
    return pages


def scaffold_pages() -> list[dict[str, Any]]:
    pages = scan_page_images()
    if not pages:
        return []

    first_three = pages[:3]
    samples = [
        {
            "id": "video-sample-file",
            "title": "Video Placeholder",
            "type": "activity",
            "src": "",
            "cues": ["Replace this slide with a real local video-file source"],
        },
        {
            "id": "activity-sample",
            "title": "Sample Activity: Hazard Spotting",
            "type": "activity",
            "src": "",
            "timing": "7m",
            "cues": ["Pair learners and call on 2 volunteers"],
        },
    ]
    return first_three + samples


def write_pages(pages: list[dict[str, Any]]) -> None:
    PAGES_JSON.write_text(json.dumps(pages, indent=2) + "\n", encoding="utf-8")


def ensure_scaffold_files() -> None:
    if not PAGES_JSON.exists():
        write_pages(scaffold_pages())

    if not NOTES_MD.exists():
        NOTES_MD.write_text(
            """---
page-001
Instructor notes:
- Welcome and set safety expectations.
Forklift callouts:
- Emphasize site-specific hazards.
Pause video cues:
- N/A

---
page-002
Instructor notes:
- Confirm PPE before movement.
Forklift callouts:
- Mirror checks and horn use.
Pause video cues:
- N/A

---
video-sample-file
Instructor notes:
- Introduce the clip context before play.
Forklift callouts:
- Tie observations to operating policy.
Pause video cues:
- Pause at marked cue for discussion.
""",
            encoding="utf-8",
        )


def sync_page_entries() -> None:
    existing: list[dict[str, Any]] = []
    if PAGES_JSON.exists():
        existing = json.loads(PAGES_JSON.read_text(encoding="utf-8"))

    scanned_pages = scan_page_images()
    carry_over = [
        entry
        for entry in existing
        if entry.get("type") not in {"page-image", "image"}
    ]
    write_pages(scanned_pages + carry_over)


def parse_notes_md(notes_text: str) -> dict[str, str]:
    notes_map: dict[str, str] = {}
    blocks = [block.strip() for block in re.split(r"(?m)^---\s*$", notes_text) if block.strip()]
    for block in blocks:
        lines = block.splitlines()
        slide_id = lines[0].strip()
        body = "\n".join(lines[1:]).strip()
        if slide_id:
            notes_map[slide_id] = body
    return notes_map


def load_pages() -> list[dict[str, Any]]:
    payload = json.loads(PAGES_JSON.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("pages.json must be a list")
    return payload


def slide_html(page: dict[str, Any], note_text: str) -> str:
    slide_id = str(page.get("id", "")).strip()
    title = str(page.get("title", "")).strip()
    slide_type = str(page.get("type", "")).strip()
    src = str(page.get("src", "")).strip()
    timing = str(page.get("timing", "")).strip()

    if not slide_id:
        raise ValueError("Each page entry needs a non-empty 'id'")
    if slide_type not in {"page-image", "video-file", "video-link", "image", "activity"}:
        raise ValueError(f"Unsupported type for '{slide_id}': {slide_type}")

    attrs: list[str] = [f'data-slide-id="{escape(slide_id)}"']
    if timing:
        attrs.append(f'data-timing="{escape(timing)}"')

    body = ""
    if slide_type in {"page-image", "image"}:
        body = (
            f'<h3>{escape(title)}</h3>\n'
            f'<img src="{escape(src)}" alt="{escape(title)}" class="slide-image" />'
        )
    elif slide_type == "video-file":
        body = (
            f'<h3>{escape(title)}</h3>\n'
            f'<video class="slide-video" controls preload="metadata" src="{escape(src)}"></video>'
        )
    elif slide_type == "video-link":
        body = (
            f'<h3>{escape(title)}</h3>\n'
            f'<iframe class="slide-video" src="{escape(src)}" title="{escape(title)}" '
            'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
        )
    else:
        cues = page.get("cues") or []
        cues_items = "".join(f"<li>{escape(str(item))}</li>" for item in cues)
        body = (
            f'<h3>{escape(title)}</h3>\n'
            '<div class="activity-card">\n'
            '<p>Instructor-led activity slide.</p>\n'
            f'<ul>{cues_items}</ul>\n'
            '</div>'
        )

    notes_html = ""
    if note_text:
        notes_html = f'\n<aside class="notes" data-markdown>\n<textarea data-template>\n{note_text}\n</textarea>\n</aside>'

    return f"<section {' '.join(attrs)}>\n{body}{notes_html}\n</section>"


def build_deck() -> None:
    pages = load_pages()
    notes_map = parse_notes_md(NOTES_MD.read_text(encoding="utf-8") if NOTES_MD.exists() else "")
    slides = "\n\n".join(slide_html(page, notes_map.get(str(page.get("id", "")), "")) for page in pages)

    html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>Instructor Deck</title>
  <link rel=\"stylesheet\" href=\"../reveal/dist/reveal.css\" />
  <link rel=\"stylesheet\" href=\"../reveal/dist/theme/black.css\" />
  <style>
    .reveal .slides section {{ text-align: left; }}
    .reveal h3 {{ margin-bottom: 0.5rem; }}
    .slide-image {{
      width: 100%;
      max-height: 80vh;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }}
    .slide-video {{
      width: 100%;
      height: 70vh;
      border: 0;
    }}
    .activity-card {{
      border: 1px solid #666;
      border-radius: 8px;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
    }}
  </style>
</head>
<body>
  <div class=\"reveal\">
    <div class=\"slides\">
{slides}
    </div>
  </div>

  <script src=\"../reveal/dist/reveal.js\"></script>
  <script src=\"../reveal/plugin/notes/notes.js\"></script>
  <script src=\"../reveal/plugin/markdown/markdown.js\"></script>
  <script>
    Reveal.initialize({{
      hash: true,
      controls: true,
      progress: true,
      center: true,
      plugins: [ RevealMarkdown, RevealNotes ]
    }});
  </script>
</body>
</html>
"""
    OUTPUT_HTML.write_text(html, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build instructor reveal.js deck")
    parser.add_argument(
        "command",
        nargs="?",
        choices=["build", "init", "sync-pages"],
        default="build",
        help="build deck, initialize scaffold, or sync pages from image sequence",
    )
    args = parser.parse_args()

    if args.command == "init":
        ensure_scaffold_files()
        build_deck()
        return

    if args.command == "sync-pages":
        ensure_scaffold_files()
        sync_page_entries()
        build_deck()
        return

    ensure_scaffold_files()
    build_deck()


if __name__ == "__main__":
    main()
