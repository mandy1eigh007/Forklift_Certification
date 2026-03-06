import Fuse from "fuse.js";
import { OUTLINE, getFlatScenes, type Scene } from "../data";
import { navigate } from "../router";
import { getState } from "../state";
import { button, el, normalizeText } from "../components/ui";

export function renderLibraryView(root: HTMLElement): () => void {
  document.body.dataset.route = "library";

  const shell = el("main", "library-shell");
  const ambiance = el("div", "library-ambiance");
  const mast = el("header", "library-mast");
  const brand = el("p", "library-brand", "Forklift Certification | Run of Show");
  const title = el("h1", "library-title", OUTLINE.meta.title);
  const sub = el(
    "p",
    "library-sub",
    "A guided walkthrough experience for facilitator flow, timing, and confidence.",
  );
  const meta = el("p", "library-meta-line", `Version ${OUTLINE.meta.version} | Updated ${OUTLINE.meta.updated}`);

  const controls = el("div", "library-controls");
  const search = document.createElement("input");
  search.className = "library-search";
  search.placeholder = "Search the walkthrough...";
  const openPresent = button("Open Present", "btn hero");
  const openControl = button("Open Console", "btn");
  controls.append(search, openPresent, openControl);

  mast.append(brand, title, sub, meta, controls);

  const quickRail = el("section", "library-quick-rail");

  const bookmarksHost = el("article", "library-quick-card");
  bookmarksHost.appendChild(el("h2", "library-section-title", "Bookmarks"));
  const bookmarkList = el("ul", "library-quick-list");
  bookmarksHost.appendChild(bookmarkList);

  const recentHost = el("article", "library-quick-card");
  recentHost.appendChild(el("h2", "library-section-title", "Recent"));
  const recentList = el("ul", "library-quick-list");
  recentHost.appendChild(recentList);

  quickRail.append(bookmarksHost, recentHost);

  const listHost = el("section", "library-walkthrough");

  shell.append(ambiance, mast, quickRail, listHost);
  root.appendChild(shell);

  const flat = getFlatScenes();
  const fuse = new Fuse(flat, {
    keys: ["title", "objective", "script", "tags"],
    threshold: 0.3,
    ignoreLocation: true,
  });

  function quickItem(scene: Scene): HTMLElement {
    const li = el("li", "library-quick-item");
    const btn = button(scene.title, "btn subtle");
    btn.addEventListener("click", () => {
      navigate("/control", { scene: scene.id });
    });
    li.appendChild(btn);
    return li;
  }

  function renderQuick(): void {
    const state = getState();
    bookmarkList.innerHTML = "";
    recentList.innerHTML = "";

    state.bookmarks.forEach((id) => {
      const scene = flat.find((item) => item.id === id);
      if (scene) {
        bookmarkList.appendChild(quickItem(scene));
      }
    });

    state.recent.forEach((id) => {
      const scene = flat.find((item) => item.id === id);
      if (scene) {
        recentList.appendChild(quickItem(scene));
      }
    });

    if (!bookmarkList.childElementCount) {
      bookmarkList.appendChild(el("li", "library-empty", "No bookmarks yet."));
    }
    if (!recentList.childElementCount) {
      recentList.appendChild(el("li", "library-empty", "No recent scenes yet."));
    }
  }

  function renderList(items: Scene[]): void {
    listHost.innerHTML = "";

    const lead = el("article", "library-intro-card");
    lead.appendChild(el("h2", "library-section-title", "Walkthrough"));
    lead.appendChild(
      el(
        "p",
        "library-intro-copy",
        "Move section-by-section, launch any scene instantly, and keep facilitator rhythm from prep to close.",
      ),
    );
    listHost.appendChild(lead);

    OUTLINE.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((section) => {
        const filtered = section.scenes.filter((scene) => items.some((it) => it.id === scene.id));
        if (!filtered.length) {
          return;
        }

        const card = el("article", "library-chapter");
        const chapterHead = el("header", "library-chapter-head");
        chapterHead.appendChild(el("p", "library-kicker", `Chapter ${String(section.order).padStart(2, "0")}`));
        chapterHead.appendChild(el("h2", "library-section-title", section.title));
        chapterHead.appendChild(
          el("p", "library-chapter-meta", `${filtered.length} scenes | ${filtered.length * 2} actions`),
        );
        card.appendChild(chapterHead);

        const ul = el("ul", "library-scene-list");
        filtered.forEach((scene, sceneIndex) => {
          const li = el("li", "library-scene-item");
          li.style.setProperty("--delay", `${sceneIndex * 0.05}s`);
          const seq = el("p", "library-scene-seq", `${String(sceneIndex + 1).padStart(2, "0")}`);
          const heading = el("h3", "library-scene-title", scene.title);
          const objective = el("p", "library-scene-objective", scene.objective);
          const meta = el("p", "library-meta", `${scene.durationMinutes} min | ${scene.tags.join(", ")}`);
          const summary = el("p", "library-scene-summary", scene.script.slice(0, 130));

          const row = el("div", "library-scene-actions");
          const goPresent = button("Present", "btn");
          const goControl = button("Console", "btn subtle");
          goPresent.addEventListener("click", () => navigate("/present", { scene: scene.id }));
          goControl.addEventListener("click", () => navigate("/control", { scene: scene.id }));
          row.append(goPresent, goControl);

          li.append(seq, heading, objective, summary, meta, row);
          ul.appendChild(li);
        });

        card.appendChild(ul);
        listHost.appendChild(card);
      });

    if (!listHost.childElementCount) {
      listHost.appendChild(el("p", "library-empty", "No scenes match your search."));
    }
  }

  function queryAndRender(): void {
    const query = normalizeText(search.value);
    if (!query) {
      renderList(flat);
      return;
    }
    const hits = fuse.search(query).map((result) => result.item);
    renderList(hits);
  }

  search.addEventListener("input", queryAndRender);
  openPresent.addEventListener("click", () => {
    const sceneId = getState().sceneId;
    navigate("/present", { scene: sceneId });
  });
  openControl.addEventListener("click", () => {
    const sceneId = getState().sceneId;
    navigate("/control", { scene: sceneId });
  });

  renderQuick();
  queryAndRender();

  return () => {
    // No global listeners to clean up for this view.
  };
}
