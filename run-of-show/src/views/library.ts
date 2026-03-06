import { getFlatScenes, type FlatScene, loadOutline } from "../data";
import { toggleBookmark } from "../state";
import type { Store } from "../state";
import { el, clear } from "../components/ui";

function templateLabel(scene: FlatScene): "STANDARD" | "VISUAL" | "COMPARE" {
  if (scene.template === "visual") return "VISUAL";
  if (scene.template === "compare") return "COMPARE";
  return "STANDARD";
}

export async function renderLibrary(root: HTMLElement, store: Store): Promise<void> {
  await loadOutline();
  const flat = getFlatScenes();

  const s = store.get();
  const activeId = s.sceneId;

  clear(root);

  const container = el("div", { className: "container" });
  const layout = el("div", { className: "library" });

  const left = el("div");
  const right = el("div");

  const header = el("div", { className: "sideHeader" });
  header.appendChild(el("div", { text: "Library", attrs: { style: "font-weight:650;font-size:18px;" } }));
  header.appendChild(el("div", { className: "kbd", text: "Open: present/control" }));
  left.appendChild(header);

  const searchRow = el("div", { className: "searchRow" });
  const input = el("input", { attrs: { placeholder: "Filter by title/section..." } }) as HTMLInputElement;
  searchRow.appendChild(input);
  left.appendChild(searchRow);

  const tree = el("div", { className: "tree" });
  left.appendChild(tree);

  const preview = el("div", { className: "card" });
  right.appendChild(preview);

  const renderTree = (q: string): void => {
    clear(tree);
    const query = q.trim().toLowerCase();

    const filtered = !query
      ? flat
      : flat.filter((x) =>
          `${x.sectionTitle} ${x.title} ${x.objective}`.toLowerCase().includes(query)
        );

    let lastSection = "";
    for (const sc of filtered) {
      if (sc.sectionTitle !== lastSection) {
        tree.appendChild(el("div", { className: "sectionTitle", text: sc.sectionTitle }));
        lastSection = sc.sectionTitle;
      }

      const btn = el("button");
      const row = el("div", { className: "sceneRow" });
      row.appendChild(el("span", { text: `${sc.id} - ${sc.title}` }));
      row.appendChild(el("span", { className: "templateBadge", text: templateLabel(sc) }));
      btn.appendChild(row);
      if (sc.id === store.get().sceneId) btn.classList.add("active");
      btn.addEventListener("click", () => {
        store.set({ sceneId: sc.id });
        renderPreview(sc);
        renderTree(input.value);
      });
      tree.appendChild(btn);
    }
  };

  const renderPreview = (sc: FlatScene): void => {
    clear(preview);

    preview.appendChild(el("div", { className: "previewTitle", text: sc.title }));
    const meta = el("div", { className: "previewMeta" });
    meta.appendChild(el("div", { text: `Section: ${sc.sectionTitle}` }));
    meta.appendChild(el("div", { text: `Scene: ${sc.id}` }));
    meta.appendChild(el("div", { text: `Duration: ${sc.durationMinutes} min` }));
    meta.appendChild(el("div", { text: `Template: ${templateLabel(sc)}` }));
    preview.appendChild(meta);

    preview.appendChild(el("div", { text: sc.objective, attrs: { style: "color:var(--muted);margin-bottom:10px;" } }));
    preview.appendChild(el("div", { text: sc.script }));

    const actions = el("div", { className: "actionsRow" });

    const present = el("a", { text: "Open Present", attrs: { href: `#/present?scene=${encodeURIComponent(sc.id)}` } });
    const control = el("a", { text: "Open Control", attrs: { href: `#/control?scene=${encodeURIComponent(sc.id)}` } });

    const isBm = store.get().bookmarks.includes(sc.id);
    const bmBtn = el("button", { text: isBm ? "Remove Bookmark" : "Bookmark" });
    bmBtn.addEventListener("click", () => {
      store.update((st) => toggleBookmark(st, sc.id));
      renderPreview(sc);
    });

    actions.appendChild(present);
    actions.appendChild(control);
    actions.appendChild(bmBtn);

    preview.appendChild(actions);
  };

  input.addEventListener("input", () => renderTree(input.value));

  layout.appendChild(left);
  layout.appendChild(right);
  container.appendChild(layout);
  root.appendChild(container);

  const active = flat.find((x) => x.id === activeId) ?? flat[0];
  store.set({ sceneId: active.id });
  renderPreview(active);
  renderTree("");
}
