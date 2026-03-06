import { searchScenes } from "../data";
import { el, clear } from "./ui";

export function showSearchPicker(onPick: (sceneId: string) => void): () => void {
  const overlay = el("div", {
    attrs: {
      style:
        "position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:56px 16px;"
    }
  });

  const panel = el("div", {
    className: "card",
    attrs: { style: "width:min(860px,calc(100vw - 32px));" }
  });

  panel.appendChild(el("div", { text: "Scene Picker", attrs: { style: "font-weight:650;margin-bottom:10px;" } }));

  const input = el("input", {
    attrs: {
      placeholder: "Search scenes (title, section, objective)...",
      style:
        "width:100%;padding:12px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#f4f4f5;"
    }
  }) as HTMLInputElement;

  const list = el("div", {
    attrs: { style: "margin-top:12px;max-height:60vh;overflow:auto;display:flex;flex-direction:column;gap:8px;" }
  });

  const render = (q: string): void => {
    clear(list);
    const hits = searchScenes(q, 30);
    hits.forEach((h) => {
      const btn = el("button", {
        attrs: {
          style:
            "text-align:left;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#f4f4f5;cursor:pointer;"
        }
      });
      btn.appendChild(el("div", { text: h.title, attrs: { style: "font-weight:650;" } }));
      btn.appendChild(el("div", { text: `${h.sectionTitle} / ${h.id}`, attrs: { style: "color:#b7b7bd;font-size:13px;margin-top:2px;" } }));
      btn.addEventListener("click", () => onPick(h.id));
      list.appendChild(btn);
    });
  };

  input.addEventListener("input", () => render(input.value));

  panel.appendChild(input);
  panel.appendChild(list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  render("");

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
  };
  window.addEventListener("keydown", onKey);

  const close = (): void => {
    window.removeEventListener("keydown", onKey);
    overlay.remove();
  };

  setTimeout(() => input.focus(), 0);

  return close;
}

export function createSearchPicker(onPick: (sceneId: string) => void): {
  node: HTMLElement;
  open: () => void;
  close: () => void;
} {
  const node = el("div");
  let closeFn: (() => void) | null = null;
  return {
    node,
    open: () => {
      closeFn = showSearchPicker((sceneId) => {
        onPick(sceneId);
        closeFn?.();
      });
    },
    close: () => {
      closeFn?.();
      closeFn = null;
    }
  };
}
