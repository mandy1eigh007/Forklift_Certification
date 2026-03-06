import { getSceneById, searchScenes } from "../data";
import { setHashRoute } from "../router";
import type { SyncBus } from "../sync";
import { clampFontScale, pushRecent, Store, toggleBookmark } from "../state";
import { renderControlScene } from "../components/sceneRenderer";
import { formatMMSS } from "../components/timer";
import { clear, el } from "../components/ui";

type ControlDeps = {
  store: Store;
  sync: SyncBus;
  setScene: (sceneId: string, sync?: boolean) => void;
  getRemainingSec: () => number;
  timerStartPause: (sync?: boolean) => void;
  timerReset: (sync?: boolean) => void;
  setTimerPreset: (minutes: number) => void;
};

export function renderControlView(root: HTMLElement, deps: ControlDeps): () => void {
  clear(root);

  const container = el("div", { className: "container" });
  const wrap = el("div", { className: "control" });
  const main = el("section", { className: "card" });
  const side = el("aside", { className: "card" });
  wrap.appendChild(main);
  wrap.appendChild(side);
  container.appendChild(wrap);
  root.appendChild(container);

  const sceneHost = el("div");
  main.appendChild(sceneHost);

  const search = el("input", { className: "smallInput", attrs: { placeholder: "Search and jump..." } }) as HTMLInputElement;
  const results = el("div", { attrs: { style: "display:grid;gap:8px;margin-top:8px;" } });

  const buttons = el("div", { className: "controlsRow" });
  const prevBtn = el("button", { text: "Prev" }) as HTMLButtonElement;
  const nextBtn = el("button", { text: "Next" }) as HTMLButtonElement;
  const pushBtn = el("button", { text: "Push to Present" }) as HTMLButtonElement;
  const revealBtn = el("button", { text: "Reveal: Off" }) as HTMLButtonElement;
  buttons.appendChild(prevBtn);
  buttons.appendChild(nextBtn);
  buttons.appendChild(pushBtn);
  buttons.appendChild(revealBtn);

  const timerRow = el("div", { className: "controlsRow" });
  const timerToggle = el("button", { text: "Start/Pause (T)" }) as HTMLButtonElement;
  const timerReset = el("button", { text: "Reset (R)" }) as HTMLButtonElement;
  const preset5 = el("button", { text: "5m" }) as HTMLButtonElement;
  const preset10 = el("button", { text: "10m" }) as HTMLButtonElement;
  const preset15 = el("button", { text: "15m" }) as HTMLButtonElement;
  timerRow.appendChild(timerToggle);
  timerRow.appendChild(timerReset);
  timerRow.appendChild(preset5);
  timerRow.appendChild(preset10);
  timerRow.appendChild(preset15);

  const displayRow = el("div", { className: "controlsRow" });
  const blackBtn = el("button", { text: "Black (B)" }) as HTMLButtonElement;
  const fontDown = el("button", { text: "A-" }) as HTMLButtonElement;
  const fontUp = el("button", { text: "A+" }) as HTMLButtonElement;
  const reduceBtn = el("button", { text: "Reduce Motion" }) as HTMLButtonElement;
  const bookmarkBtn = el("button", { text: "Bookmark" }) as HTMLButtonElement;
  displayRow.appendChild(blackBtn);
  displayRow.appendChild(fontDown);
  displayRow.appendChild(fontUp);
  displayRow.appendChild(reduceBtn);
  displayRow.appendChild(bookmarkBtn);

  const linkRow = el("div", { className: "controlsRow" });
  const presentLink = el("a", { text: "Open Present", attrs: { href: "#/present" } });
  const libraryLink = el("a", { text: "Open Library", attrs: { href: "#/" } });
  linkRow.appendChild(presentLink);
  linkRow.appendChild(libraryLink);

  side.appendChild(el("h1", { text: "Console" }));
  side.appendChild(search);
  side.appendChild(results);
  side.appendChild(el("hr"));
  side.appendChild(buttons);
  side.appendChild(timerRow);
  side.appendChild(displayRow);
  side.appendChild(linkRow);

  let reveal = false;

  function renderSearch(query: string): void {
    clear(results);
    if (!query.trim()) return;
    for (const hit of searchScenes(query, 8)) {
      const btn = el("button", {
        text: `${hit.title} - ${hit.sectionTitle}`,
        className: "smallInput",
        attrs: { style: "text-align:left;cursor:pointer;" }
      }) as HTMLButtonElement;
      btn.addEventListener("click", () => deps.setScene(hit.id));
      results.appendChild(btn);
    }
  }

  function render(): void {
    const state = deps.store.get();
    const scene = getSceneById(state.sceneId);
    if (!scene) return;

    renderControlScene(sceneHost, scene, {
      timerText: formatMMSS(deps.getRemainingSec()),
      reveal
    });

    presentLink.setAttribute("href", `#/present?scene=${encodeURIComponent(scene.id)}`);
    libraryLink.setAttribute("href", `#/?scene=${encodeURIComponent(scene.id)}`);
    reduceBtn.textContent = state.settings.reduceMotion ? "Reduce Motion: On" : "Reduce Motion: Off";
  }

  search.addEventListener("input", () => renderSearch(search.value));

  prevBtn.addEventListener("click", () => {
    const state = deps.store.get();
    const list = searchScenes("", 1000).map((x) => x.id);
    const i = list.indexOf(state.sceneId);
    if (i > 0) deps.setScene(list[i - 1]);
  });

  nextBtn.addEventListener("click", () => {
    const state = deps.store.get();
    const list = searchScenes("", 1000).map((x) => x.id);
    const i = list.indexOf(state.sceneId);
    if (i >= 0 && i < list.length - 1) deps.setScene(list[i + 1]);
  });

  pushBtn.addEventListener("click", () => {
    deps.sync.send({ type: "SET_SCENE", sceneId: deps.store.get().sceneId });
  });

  revealBtn.addEventListener("click", () => {
    reveal = !reveal;
    revealBtn.textContent = reveal ? "Reveal: On" : "Reveal: Off";
    render();
  });

  timerToggle.addEventListener("click", () => deps.timerStartPause());
  timerReset.addEventListener("click", () => deps.timerReset());
  preset5.addEventListener("click", () => deps.setTimerPreset(5));
  preset10.addEventListener("click", () => deps.setTimerPreset(10));
  preset15.addEventListener("click", () => deps.setTimerPreset(15));

  blackBtn.addEventListener("click", () => {
    const value = !deps.store.get().settings.blackScreen;
    deps.store.update((s) => ({ ...s, settings: { ...s.settings, blackScreen: value } }));
    deps.sync.send({ type: "SET_BLACK", value });
  });

  fontDown.addEventListener("click", () => {
    const value = clampFontScale(deps.store.get().settings.fontScale - 0.1);
    deps.store.update((s) => ({ ...s, settings: { ...s.settings, fontScale: value } }));
    deps.sync.send({ type: "SET_FONT_SCALE", value });
  });

  fontUp.addEventListener("click", () => {
    const value = clampFontScale(deps.store.get().settings.fontScale + 0.1);
    deps.store.update((s) => ({ ...s, settings: { ...s.settings, fontScale: value } }));
    deps.sync.send({ type: "SET_FONT_SCALE", value });
  });

  reduceBtn.addEventListener("click", () => {
    deps.store.update((s) => ({ ...s, settings: { ...s.settings, reduceMotion: !s.settings.reduceMotion } }));
  });

  bookmarkBtn.addEventListener("click", () => {
    const id = deps.store.get().sceneId;
    deps.store.update((s) => toggleBookmark(s, id));
  });

  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key.toLowerCase() === "b") {
      ev.preventDefault();
      blackBtn.click();
    }
    if (ev.key.toLowerCase() === "t") {
      ev.preventDefault();
      timerToggle.click();
    }
    if (ev.key.toLowerCase() === "r") {
      ev.preventDefault();
      timerReset.click();
    }
    if (ev.key === "/") {
      ev.preventDefault();
      search.focus();
    }
  };

  document.addEventListener("keydown", onKey);

  const unsub = deps.store.subscribe(() => {
    render();
    setHashRoute("control", deps.store.get().sceneId);
  });

  return () => {
    unsub();
    document.removeEventListener("keydown", onKey);
  };
}

let cleanupControl: (() => void) | null = null;

export function disposeControl(): void {
  cleanupControl?.();
  cleanupControl = null;
}

export async function renderControl(
  root: HTMLElement,
  store: Store,
  bus: SyncBus,
  _sceneId?: string
): Promise<void> {
  disposeControl();

  const setScene = (sceneId: string, sync = true): void => {
    const safe = getSceneById(sceneId)?.id;
    if (!safe) return;
    store.update((s) => pushRecent({ ...s, sceneId: safe }, safe));
    if (sync) bus.send({ type: "SET_SCENE", sceneId: safe });
  };

  const getRemainingSec = (): number => {
    const t = store.get().timer;
    if (t.mode !== "running") return Math.max(0, t.remainingSec);
    return Math.max(0, Math.ceil((t.endsAtMs - Date.now()) / 1000));
  };

  const timerStartPause = (sync = true): void => {
    const now = Date.now();
    const current = store.get();

    if (current.timer.mode === "running") {
      const remainingSec = getRemainingSec();
      store.set({ timer: { mode: "paused", remainingSec, endsAtMs: null } });
      if (sync) bus.send({ type: "TIMER_PAUSE", remainingSec });
      return;
    }

    const scene = getSceneById(current.sceneId);
    const seed = current.timer.remainingSec > 0 ? current.timer.remainingSec : (scene?.durationMinutes ?? 10) * 60;
    const endsAtMs = now + seed * 1000;
    store.set({ timer: { mode: "running", remainingSec: seed, endsAtMs } });
    if (sync) bus.send({ type: "TIMER_START", endsAtMs });
  };

  const timerReset = (sync = true): void => {
    store.set({ timer: { mode: "idle", remainingSec: 0, endsAtMs: null } });
    if (sync) bus.send({ type: "TIMER_RESET" });
  };

  const cleanupView = renderControlView(root, {
    store,
    sync: bus,
    setScene,
    getRemainingSec,
    timerStartPause,
    timerReset,
    setTimerPreset: (minutes: number) => {
      store.set({ timer: { mode: "paused", remainingSec: Math.max(60, Math.round(minutes * 60)), endsAtMs: null } });
    }
  });

  const timerTick = window.setInterval(() => {
    const timer = store.get().timer;
    if (timer.mode !== "running") return;
    const remainingSec = getRemainingSec();
    if (remainingSec <= 0) {
      store.set({ timer: { mode: "idle", remainingSec: 0, endsAtMs: null } });
      return;
    }
    if (remainingSec !== timer.remainingSec) {
      store.set({ timer: { mode: "running", remainingSec, endsAtMs: timer.endsAtMs } });
    }
  }, 250);

  cleanupControl = () => {
    cleanupView();
    window.clearInterval(timerTick);
  };
}
