import type Fuse from "fuse.js";
import type { Scene } from "../data";
import { el } from "./ui";

export function createSearchPicker(
  scenes: Scene[],
  fuse: Fuse<Scene>,
  onPick: (sceneId: string) => void,
): { open: () => void; close: () => void; mount: HTMLElement } {
  const overlay = el("div", "picker-overlay hidden");
  overlay.setAttribute("aria-hidden", "true");

  const panel = el("div", "picker-panel");
  const input = document.createElement("input");
  input.className = "picker-input";
  input.placeholder = "Search scene title, tags, script...";
  input.setAttribute("aria-label", "Scene picker search");

  const list = el("ul", "picker-list");
  panel.append(input, list);
  overlay.appendChild(panel);

  function renderResults(query: string): void {
    list.innerHTML = "";
    const matches: Scene[] = query.trim()
      ? fuse.search(query).slice(0, 12).map((m) => m.item)
      : scenes.slice(0, 12);
    matches.forEach((scene) => {
      const li = el("li", "picker-item");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "picker-item-btn";
      btn.textContent = scene.title;
      btn.addEventListener("click", () => {
        onPick(scene.id);
        close();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function open(): void {
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    input.value = "";
    renderResults("");
    window.setTimeout(() => input.focus(), 0);
  }

  function close(): void {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  input.addEventListener("input", () => renderResults(input.value));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });

  return { open, close, mount: overlay };
}
