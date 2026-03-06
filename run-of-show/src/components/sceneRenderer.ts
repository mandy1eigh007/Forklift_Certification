import type { FlatScene } from "../data";
import { el, clear } from "./ui";

export function renderPresentScene(root: HTMLElement, scene: FlatScene, opts: {
  fontScale: number;
  timerText: string;
  showTimer: boolean;
}): void {
  clear(root);

  const top = el("div", { className: "presentTop" });
  top.appendChild(el("div", { className: "crumb", text: `${scene.sectionTitle} / ${scene.id}` }));

  const main = el("div", { className: "presentMain" });
  const frame = el("div", { className: "presentFrame" });

  frame.appendChild(el("h1", { className: "presentTitle", text: scene.title }));
  frame.appendChild(el("div", { className: "presentObjective", text: scene.objective }));

  frame.appendChild(el("p", { className: "presentScript", text: scene.script }));

  const cols = el("div", { className: "presentCols" });

  const steps = el("div", { className: "block" });
  steps.appendChild(el("h3", { text: "Do" }));
  const ulSteps = el("ul");
  (scene.steps ?? []).slice(0, 5).forEach((s) => ulSteps.appendChild(el("li", { text: s })));
  steps.appendChild(ulSteps);

  const ask = el("div", { className: "block" });
  ask.appendChild(el("h3", { text: "Ask" }));
  const ulAsk = el("ul");
  (scene.ask ?? []).slice(0, 1).forEach((s) => ulAsk.appendChild(el("li", { text: s })));
  ask.appendChild(ulAsk);

  cols.appendChild(steps);
  cols.appendChild(ask);

  // watchFor (optional, only one block max)
  const wf = (scene.watchFor ?? []).slice(0, 1);
  if (wf.length) {
    const wfb = el("div", { className: "block" });
    wfb.appendChild(el("h3", { text: "Watch for" }));
    const ul = el("ul");
    ul.appendChild(el("li", { text: wf[0] }));
    wfb.appendChild(ul);
    cols.appendChild(wfb);
  }

  frame.appendChild(cols);

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
