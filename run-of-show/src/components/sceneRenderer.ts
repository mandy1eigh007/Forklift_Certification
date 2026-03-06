import type { FlatScene } from "../data";
import { el, clear } from "./ui";

type PresentOpts = {
  fontScale: number;
  timerText: string;
  showTimer: boolean;
};

function normalizeTemplate(scene: FlatScene): "standard" | "visual" | "compare" {
  if (scene.template === "visual" || scene.template === "compare") return scene.template;
  return "standard";
}

function renderHeader(frame: HTMLElement, scene: FlatScene): void {
  frame.appendChild(el("h1", { className: "presentTitle", text: scene.title }));
  frame.appendChild(el("div", { className: "presentObjective", text: scene.objective }));
  frame.appendChild(el("p", { className: "presentScript", text: scene.script }));
}

function buildBlock(title: string, lines: string[]): HTMLElement {
  const block = el("div", { className: "block" });
  block.appendChild(el("h3", { text: title }));
  const ul = el("ul");
  lines.forEach((line) => ul.appendChild(el("li", { text: line })));
  block.appendChild(ul);
  return block;
}

function renderStandardScene(frame: HTMLElement, scene: FlatScene): void {
  const cols = el("div", { className: "presentCols" });
  cols.appendChild(buildBlock("Do", (scene.steps ?? []).slice(0, 5)));
  cols.appendChild(buildBlock("Ask", (scene.ask ?? []).slice(0, 1)));

  const wf = (scene.watchFor ?? []).slice(0, 1);
  if (wf.length) cols.appendChild(buildBlock("Watch for", wf));

  frame.appendChild(cols);
}

function renderVisualScene(frame: HTMLElement, scene: FlatScene): void {
  const layout = el("div", { className: "visualLayout" });
  const left = el("div", { className: "visualLeft" });
  const right = el("div", { className: "visualRight" });

  const cols = el("div", { className: "presentCols" });
  cols.appendChild(buildBlock("Do", (scene.steps ?? []).slice(0, 6)));
  cols.appendChild(buildBlock("Ask", (scene.ask ?? []).slice(0, 1)));
  const wf = (scene.watchFor ?? []).slice(0, 1);
  if (wf.length) cols.appendChild(buildBlock("Watch for", wf));
  left.appendChild(cols);

  const firstImage = (scene.media ?? []).find((m) => m.type === "image");
  if (!firstImage) {
    right.appendChild(el("div", { className: "mediaMissing", text: "Missing media: no image item in scene.media" }));
  } else {
    const mediaWrap = el("figure", { className: "mediaFigure" });
    const img = document.createElement("img");
    img.className = "mediaImage";
    img.alt = firstImage.title || scene.title;
    img.src = firstImage.src;
    img.onerror = () => {
      clear(mediaWrap);
      mediaWrap.appendChild(el("div", { className: "mediaMissing", text: `Missing media: ${firstImage.src}` }));
    };
    mediaWrap.appendChild(img);
    if (firstImage.title) mediaWrap.appendChild(el("figcaption", { className: "mediaCaption", text: firstImage.title }));
    right.appendChild(mediaWrap);
  }

  layout.appendChild(left);
  layout.appendChild(right);
  frame.appendChild(layout);
}

function splitCompareSteps(steps: string[]): { forklift: string[]; telehandler: string[] } {
  const forklift: string[] = [];
  const telehandler: string[] = [];

  steps.forEach((line) => {
    const fPrefix = /^forklift\s*:\s*/i;
    const tPrefix = /^telehandler\s*:\s*/i;
    if (fPrefix.test(line)) forklift.push(line.replace(fPrefix, "").trim());
    if (tPrefix.test(line)) telehandler.push(line.replace(tPrefix, "").trim());
  });

  return { forklift, telehandler };
}

function renderCompareScene(frame: HTMLElement, scene: FlatScene): void {
  const { forklift, telehandler } = splitCompareSteps(scene.steps ?? []);
  if (!forklift.length && !telehandler.length) {
    renderStandardScene(frame, scene);
    return;
  }

  const compare = el("div", { className: "compareCols" });

  const left = el("div", { className: "block" });
  left.appendChild(el("h3", { text: "Forklift (Classes 1-5)" }));
  const leftList = el("ul");
  forklift.forEach((line) => leftList.appendChild(el("li", { text: line })));
  left.appendChild(leftList);

  const right = el("div", { className: "block" });
  right.appendChild(el("h3", { text: "Telehandler (Class 7)" }));
  const rightList = el("ul");
  telehandler.forEach((line) => rightList.appendChild(el("li", { text: line })));
  right.appendChild(rightList);

  compare.appendChild(left);
  compare.appendChild(right);
  frame.appendChild(compare);

  const ask = (scene.ask ?? []).slice(0, 1);
  if (ask.length) frame.appendChild(buildBlock("Ask", ask));
  const wf = (scene.watchFor ?? []).slice(0, 1);
  if (wf.length) frame.appendChild(buildBlock("Watch for", wf));
}

function renderBodyByTemplate(frame: HTMLElement, scene: FlatScene): void {
  const template = normalizeTemplate(scene);
  if (template === "visual") {
    renderVisualScene(frame, scene);
    return;
  }
  if (template === "compare") {
    renderCompareScene(frame, scene);
    return;
  }
  renderStandardScene(frame, scene);
}

export function renderPresentScene(root: HTMLElement, scene: FlatScene, opts: PresentOpts): void {
  clear(root);

  const top = el("div", { className: "presentTop" });
  top.appendChild(el("div", { className: "crumb", text: `${scene.sectionTitle} / ${scene.id}` }));

  const main = el("div", { className: "presentMain" });
  const frame = el("div", { className: "presentFrame" });

  renderHeader(frame, scene);
  renderBodyByTemplate(frame, scene);

  const timerBar = el("div", { className: "timerBar" });
  timerBar.appendChild(el("div", { text: opts.showTimer ? `Timer: ${opts.timerText}` : "" }));
  timerBar.appendChild(el("div", { className: "kbd", text: "Right/Space next  Left prev  / picker  B black  F fullscreen" }));
  frame.appendChild(timerBar);

  main.appendChild(frame);

  root.style.setProperty("--fontScale", String(opts.fontScale));
  root.appendChild(top);
  root.appendChild(main);
}

export function renderControlScene(root: HTMLElement, scene: FlatScene, opts: {
  timerText: string;
  reveal: boolean;
}): void {
  clear(root);

  root.appendChild(el("div", { className: "controlTitle", text: scene.title }));

  const meta = el("div", { className: "controlMeta" });
  meta.appendChild(el("div", { text: `Section: ${scene.sectionTitle}` }));
  meta.appendChild(el("div", { text: `Scene: ${scene.id}` }));
  meta.appendChild(el("div", { text: `Duration: ${scene.durationMinutes} min` }));
  meta.appendChild(el("div", { text: `Timer: ${opts.timerText}` }));
  root.appendChild(meta);

  const grid = el("div", { className: "card controlBlock" });

  const addBlock = (title: string, lines: string[] | string) => {
    const b = el("div", { className: "card controlBlock" });
    b.appendChild(el("h3", { text: title }));
    if (Array.isArray(lines)) {
      const ul = el("ul");
      lines.forEach((x) => ul.appendChild(el("li", { text: x })));
      b.appendChild(ul);
    } else {
      b.appendChild(el("p", { text: lines }));
    }
    return b;
  };

  root.appendChild(addBlock("Objective", scene.objective));
  root.appendChild(addBlock("Script", scene.script));
  if (scene.steps?.length) root.appendChild(addBlock("Steps", scene.steps));
  if (scene.ask?.length) root.appendChild(addBlock("Discussion", scene.ask));
  if (scene.watchFor?.length) root.appendChild(addBlock("Watch for", scene.watchFor));

  if (scene.notes) root.appendChild(addBlock("Instructor notes", scene.notes));

  const canReveal = !!scene.answers?.enabled && (scene.answers.items?.length ?? 0) > 0;
  if (canReveal) {
    const b = el("div", { className: "card controlBlock" });
    b.appendChild(el("h3", { text: "Answers" }));
    if (!opts.reveal) {
      b.appendChild(el("p", { text: "Hidden (toggle Reveal to show)." }));
    } else {
      const ul = el("ul");
      (scene.answers?.items ?? []).forEach((x) => ul.appendChild(el("li", { text: x })));
      b.appendChild(ul);
    }
    root.appendChild(b);
  }

  root.appendChild(grid);
}
