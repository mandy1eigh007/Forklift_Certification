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
    tags = [str(tag).strip() for tag in (page.get("tags") or []) if str(tag).strip()]
    cues = [str(cue).strip() for cue in (page.get("cues") or []) if str(cue).strip()]

    if not slide_id:
        raise ValueError("Each page entry needs a non-empty 'id'")
    if slide_type not in {"page-image", "video-file", "video-link", "image", "activity"}:
        raise ValueError(f"Unsupported type for '{slide_id}': {slide_type}")

    attrs: list[str] = [f'data-slide-id="{escape(slide_id)}"']
    if timing:
        attrs.append(f'data-timing="{escape(timing)}"')
    classes = ["deck-slide", f"slide-{slide_type}"]
    classes.extend([f"tag-{tag.lower().replace(' ', '-')}" for tag in tags])
    attrs.append(f'class="{" ".join(escape(cls) for cls in classes)}"')

    chips_html = "".join(f'<span class="chip">{escape(tag)}</span>' for tag in tags)
    title_html = f'<h2 class="slide-title">{escape(title or slide_id)}</h2>'

    body = ""
    if slide_type in {"page-image", "image"}:
        body = (
            '<div class="slide-shell">\n'
            f'<header class="slide-header">{title_html}<div class="chip-row">{chips_html}</div></header>\n'
            '<div class="frame frame-image">\n'
            f'<img src="{escape(src)}" alt="{escape(title or slide_id)}" class="slide-image" />\n'
            '</div>\n'
            '</div>'
        )
    elif slide_type == "video-file":
        body = (
            '<div class="slide-shell">\n'
            f'<header class="slide-header">{title_html}<div class="chip-row">{chips_html}</div></header>\n'
            '<div class="frame frame-video">\n'
            f'<video class="slide-video" controls preload="metadata" src="{escape(src)}"></video>\n'
            '</div>\n'
            '</div>'
        )
    elif slide_type == "video-link":
        body = (
            '<div class="slide-shell">\n'
            f'<header class="slide-header">{title_html}<div class="chip-row">{chips_html}</div></header>\n'
            '<div class="frame frame-video">\n'
            f'<iframe class="slide-video" src="{escape(src)}" title="{escape(title or slide_id)}" '
            'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>\n'
            '</div>\n'
            '</div>'
        )
    else:
        cues_items = "".join(f"<li>{escape(item)}</li>" for item in cues)
        body = (
            '<div class="slide-shell">\n'
            f'<header class="slide-header">{title_html}<div class="chip-row">{chips_html}</div></header>\n'
            '<div class="frame frame-activity">\n'
            '<div class="activity-card">\n'
            '<p class="activity-label">Instructor-led activity</p>\n'
            f'<ul>{cues_items}</ul>\n'
            '</div>\n'
            '</div>\n'
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
    <link rel=\"stylesheet\" href=\"../reveal/dist/theme/fonts/source-sans-pro/source-sans-pro.css\" />
    <link rel=\"stylesheet\" href=\"../reveal/dist/theme/fonts/league-gothic/league-gothic.css\" />
  <style>
        :root {{
            --bg-0: #0f1113;
            --bg-1: #181d22;
            --panel: rgba(8, 10, 12, 0.72);
            --line: rgba(255, 255, 255, 0.22);
            --text: #f3f1ed;
            --muted: #c6c2ba;
            --accent: #f0b351;
        }}
        html,
        body {{
            background: radial-gradient(circle at 15% 10%, #2f3a45 0%, var(--bg-0) 45%, #050607 100%);
        }}
        .reveal {{
            color: var(--text);
            font-family: "Source Sans Pro", "Helvetica Neue", Helvetica, sans-serif;
            font-size: 34px;
            text-shadow: none;
        }}
        .reveal .slides {{
            text-align: left;
        }}
        .reveal .slides section {{
            height: 100%;
        }}
        .deck-slide {{
            padding: 0.4rem;
        }}
        .slide-shell {{
            position: relative;
            height: 100%;
            border: 1px solid var(--line);
            background: linear-gradient(150deg, var(--panel), rgba(10, 11, 13, 0.9));
            border-radius: 16px;
            backdrop-filter: blur(1px);
            box-shadow: 0 32px 60px rgba(0, 0, 0, 0.45);
            padding: 1rem 1rem 0.85rem;
            overflow: hidden;
            transform: translateY(16px) scale(0.986);
            opacity: 0;
            transition: transform 480ms ease, opacity 480ms ease;
        }}
        .deck-slide.is-active .slide-shell {{
            transform: translateY(0) scale(1);
            opacity: 1;
        }}
        .slide-shell::before {{
            content: "";
            position: absolute;
            inset: -30% -20% auto auto;
            width: 55%;
            height: 46%;
            pointer-events: none;
            background: radial-gradient(circle, rgba(240, 179, 81, 0.2) 0%, rgba(240, 179, 81, 0) 72%);
        }}
        .slide-header {{
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.65rem;
        }}
        .slide-title {{
            margin: 0;
            line-height: 1;
            font-family: "League Gothic", Impact, sans-serif;
            letter-spacing: 0.02em;
            font-size: clamp(1.2rem, 2.5vw, 2.3rem);
            text-transform: uppercase;
            color: #f6f4ef;
        }}
        .chip-row {{
            display: flex;
            gap: 0.35rem;
            flex-wrap: wrap;
            justify-content: flex-end;
        }}
        .chip {{
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-radius: 999px;
            padding: 0.08rem 0.48rem;
            font-size: 0.38rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--muted);
        }}
        .frame {{
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(4, 5, 6, 0.64);
            min-height: 82%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }}
        .frame-image {{
            padding: 0.1rem;
        }}
    .slide-image {{
      width: 100%;
            max-height: 75vh;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }}
    .slide-video {{
      width: 100%;
            height: 72vh;
      border: 0;
            display: block;
            background: #060709;
        }}
        .frame-activity {{
            align-items: stretch;
            justify-content: stretch;
    }}
    .activity-card {{
            border: 1px solid rgba(240, 179, 81, 0.4);
            border-radius: 12px;
            padding: 1rem 1.1rem;
            background: linear-gradient(180deg, rgba(26, 29, 33, 0.92), rgba(12, 13, 15, 0.9));
            width: 100%;
            height: 100%;
            color: #eae7e0;
        }}
        .activity-label {{
            margin: 0 0 0.6rem;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            font-size: 0.38rem;
            color: var(--accent);
        }}
        .activity-card ul {{
            margin: 0;
            padding-left: 1.1rem;
            line-height: 1.2;
            font-size: 0.72rem;
        }}
        .activity-card li + li {{
            margin-top: 0.4rem;
        }}
        .reveal .controls,
        .reveal .progress {{
            color: var(--accent);
        }}
        @media (max-width: 900px) {{
            .reveal {{
                font-size: 24px;
            }}
            .slide-shell {{
                padding: 0.7rem;
            }}
            .slide-video {{
                height: 64vh;
            }}
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
        function markActiveSlide() {{
            document.querySelectorAll('.deck-slide').forEach((slide) => slide.classList.remove('is-active'));
            const current = Reveal.getCurrentSlide();
            if (current && current.classList.contains('deck-slide')) {{
                // Stagger helps each slide feel intentionally entered instead of snapping.
                setTimeout(() => current.classList.add('is-active'), 30);
            }}
        }}

    Reveal.initialize({{
      hash: true,
      controls: true,
      progress: true,
            center: false,
            width: 1600,
            height: 900,
            margin: 0.02,
            transition: 'fade',
            backgroundTransition: 'fade',
      plugins: [ RevealMarkdown, RevealNotes ]
    }});

        Reveal.on('ready', markActiveSlide);
        Reveal.on('slidechanged', markActiveSlide);
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
