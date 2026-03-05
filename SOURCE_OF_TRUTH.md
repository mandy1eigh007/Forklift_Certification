# Forklift Certification — Source of Truth

This project’s goal is a student-friendly training guide that **keeps Class 7 telehandler content intact** while showing **Class 1–5 forklift inserts** on the right **only when supported by the alignment source**.

## Non‑Negotiables

- **Do not edit Class 7 (telehandler) wording.** Layout changes are OK; rewriting Class 7 text is not.
- **Forklift inserts must be slide‑cited** to: `sources/crosswalk/class_1_5_manual allignment.pdf`.
- **No unsourced boilerplate.** Any forklift callout whose reference is only `Ref: Page …` is treated as unsourced and should not appear in the final student view.
- **Two-column split:** Left = Class 7, Right = Class 1–5 inserts.

## What “Good” Looks Like (Visual)

- **Continuous flow** (no fake “page” breaks on screen; no forced blank pages in print/PDF export).
- **No big blank white blocks** created by layout mechanics.
- **Image pages do not reserve an empty right column** (images display full width).

## Current Implementation (index.html)

File: `index.html`

### Layout
- Base authoring uses `.page` / `.paired-rows` / `.paired-row`.
- Runtime converts each `.page` into a `.two-col-page` with:
  - `.tele-col` containing all left-column content in order
  - `.fork-col` containing only `.hl-blue` forklift callouts

### Runtime cleanup rules
- Remove any forklift callout box (`.hl-blue`) whose internal `.ref` starts with `Ref: Page `.
- Inject a small number of **slide‑cited** callouts for specific headings where needed.
- After reflow, remove pages that are truly empty (prevents blank white blocks).

## Editing Workflow (So We Don’t Get Lost)

1. **When changing layout:** edit CSS in `index.html` only.
2. **When changing forklift inserts:**
   - Prefer updating the HTML callouts to be slide‑cited directly, OR
   - Update the small injection block at the bottom script (keep it minimal and slide‑cited).
3. **Never introduce new citations** unless they explicitly reference the alignment PDF slides.

## Quick Checks

- Search for unsourced blocks: `Ref: Page ` (these should not appear after runtime).
- Search for forbidden boilerplate: `B56.1` (should not be in final view).
- Ensure the split stays clean: `.two-col-page` has both columns and a center divider.
