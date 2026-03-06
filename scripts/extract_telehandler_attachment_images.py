#!/usr/bin/env python3
"""
Extract telehandler attachment pages from a source PDF into PNG assets.

Examples:
  python3 scripts/extract_telehandler_attachment_images.py
  python3 scripts/extract_telehandler_attachment_images.py \
    --pdf "sources/genie/2025 Genie Lift Pro Telehandler Trainer's Guide.pdf" \
    --scale 3 \
    --page quick-attach=120 \
    --page rotating-carriage=122 \
    --page swing-carriage=123 \
    --page overview=121
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


DEFAULT_OUTPUT_DIR = Path("run-of-show/public/media/telehandler/attachments")
DEFAULT_CANDIDATES = [
    Path("/mnt/data/Pages from 2025 Genie Lift Pro Telehandler Trainer's Guide.pdf"),
    Path("sources/genie/2025 Genie Lift Pro Telehandler Trainer's Guide.pdf"),
]

# 1-based page numbers. Update these for your exact source pages.
DEFAULT_PAGE_MAP = {
    "quick-attach": 1,
    "rotating-carriage": 1,
    "swing-carriage": 1,
    "overview": 1,
}


def parse_page_overrides(values: list[str]) -> dict[str, int]:
    parsed: dict[str, int] = {}
    for item in values:
        if "=" not in item:
            raise ValueError(f"Invalid --page value '{item}'. Use name=page_number.")
        key, raw_num = item.split("=", 1)
        key = key.strip()
        if key not in DEFAULT_PAGE_MAP:
            allowed = ", ".join(DEFAULT_PAGE_MAP.keys())
            raise ValueError(f"Unknown page key '{key}'. Allowed: {allowed}")
        try:
            num = int(raw_num)
        except ValueError as exc:
            raise ValueError(f"Invalid page number '{raw_num}' for key '{key}'.") from exc
        if num < 1:
            raise ValueError(f"Page number for '{key}' must be >= 1.")
        parsed[key] = num
    return parsed


def resolve_pdf_path(user_pdf: str | None) -> Path:
    if user_pdf:
        p = Path(user_pdf)
        if p.exists():
            return p
        raise FileNotFoundError(f"PDF not found at '{p}'.")

    for candidate in DEFAULT_CANDIDATES:
        if candidate.exists():
            return candidate
    tried = "\n- ".join(str(x) for x in DEFAULT_CANDIDATES)
    raise FileNotFoundError(
        "No default PDF found. Use --pdf to pass a path.\nTried:\n- " + tried
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract telehandler attachment PNGs from a PDF.")
    parser.add_argument("--pdf", help="Path to source PDF.")
    parser.add_argument("--scale", type=float, default=3.0, help="Render scale multiplier (default: 3.0).")
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument(
        "--page",
        action="append",
        default=[],
        help="Override one page mapping, e.g. --page quick-attach=120 (1-based).",
    )

    args = parser.parse_args()

    try:
        import fitz  # PyMuPDF
    except ModuleNotFoundError:
        print("PyMuPDF is required. Install with: pip install pymupdf", file=sys.stderr)
        return 2

    try:
        pdf_path = resolve_pdf_path(args.pdf)
        overrides = parse_page_overrides(args.page)
    except (FileNotFoundError, ValueError) as err:
        print(str(err), file=sys.stderr)
        return 2

    page_map = {**DEFAULT_PAGE_MAP, **overrides}
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    try:
        for name, one_based_page in page_map.items():
            zero_based = one_based_page - 1
            if zero_based < 0 or zero_based >= len(doc):
                print(
                    f"Skipping '{name}': page {one_based_page} out of range (1..{len(doc)}).",
                    file=sys.stderr,
                )
                continue
            page = doc.load_page(zero_based)
            pix = page.get_pixmap(matrix=fitz.Matrix(args.scale, args.scale), alpha=False)
            out_path = output_dir / f"{name}.png"
            pix.save(out_path)
            print(f"Wrote {out_path}")
    finally:
        doc.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
