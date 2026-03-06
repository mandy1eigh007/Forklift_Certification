import { getNextSceneId, getPrevSceneId, getSceneById } from "../data";
import type { SyncBus } from "../sync";
import { clampFontScale, pushRecent, Store } from "../state";
import { renderPresentScene } from "../components/sceneRenderer";
import { showSearchPicker } from "../components/searchPicker";
import { formatMMSS } from "../components/timer";
import { clear, el, isTypingTarget } from "../components/ui";

type PresentDeps = {
  store: Store;
  sync: SyncBus;
  setScene: (sceneId: string, sync?: boolean) => void;
  getRemainingSec: () => number;
  timerStartPause: (sync?: boolean) => void;
  timerReset: (sync?: boolean) => void;
};

export function renderPresentView(root: HTMLElement, deps: PresentDeps): () => void {
  clear(root);

  const presentRoot = el("div", { className: "presentRoot" });
  const frame = el("div");
  const overlay = el("div", { className: "blackOverlay" });
  let closePicker: (() => void) | null = null;

  presentRoot.appendChild(frame);
  root.appendChild(presentRoot);
  document.body.appendChild(overlay);

  function update(): void {
    const s = deps.store.get();
    const scene = getSceneById(s.sceneId);
    if (!scene) return;

    renderPresentScene(frame, scene, {
      fontScale: s.settings.fontScale,
      timerText: formatMMSS(deps.getRemainingSec()),
      showTimer: true
    });

    overlay.classList.toggle("on", s.settings.blackScreen);
    document.documentElement.style.setProperty("--fontScale", String(s.settings.fontScale));
    document.documentElement.style.setProperty("scroll-behavior", s.settings.reduceMotion ? "auto" : "smooth");
  }

  function toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
      return;
    }
    void document.exitFullscreen();
  }

  function onKeydown(ev: KeyboardEvent): void {
    if (isTypingTarget(ev)) return;

    if (ev.key === "/") {
      ev.preventDefault();
      closePicker = showSearchPicker((sceneId) => {
        deps.setScene(sceneId);
        closePicker?.();
        closePicker = null;
      });
      return;
    }

    if (ev.key === "ArrowRight" || ev.key === " ") {
      ev.preventDefault();
      deps.setScene(getNextSceneId(deps.store.get().sceneId));
      return;
    }

    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      deps.setScene(getPrevSceneId(deps.store.get().sceneId));
      return;
    }

    if (ev.key.toLowerCase() === "b") {
      ev.preventDefault();
      const value = !deps.store.get().settings.blackScreen;
      deps.store.update((s) => ({ ...s, settings: { ...s.settings, blackScreen: value } }));
      deps.sync.send({ type: "SET_BLACK", value });
      return;
    }

    if (ev.key.toLowerCase() === "f") {
      ev.preventDefault();
      toggleFullscreen();
      return;
    }

    if (ev.key === "+" || ev.key === "=") {
      ev.preventDefault();
      const value = clampFontScale(deps.store.get().settings.fontScale + 0.1);
      deps.store.update((s) => ({ ...s, settings: { ...s.settings, fontScale: value } }));
      deps.sync.send({ type: "SET_FONT_SCALE", value });
      return;
    }

    if (ev.key === "-" || ev.key === "_") {
      ev.preventDefault();
      const value = clampFontScale(deps.store.get().settings.fontScale - 0.1);
      deps.store.update((s) => ({ ...s, settings: { ...s.settings, fontScale: value } }));
      deps.sync.send({ type: "SET_FONT_SCALE", value });
      return;
    }

    if (ev.key.toLowerCase() === "t") {
      ev.preventDefault();
      deps.timerStartPause();
      return;
    }

    if (ev.key.toLowerCase() === "r") {
      ev.preventDefault();
      deps.timerReset();
    }
  }

  const unsub = deps.store.subscribe(update);
  document.addEventListener("keydown", onKeydown);

  return () => {
    closePicker?.();
    overlay.remove();
    unsub();
    document.removeEventListener("keydown", onKeydown);
  };
}

let cleanupPresent: (() => void) | null = null;

export function disposePresent(): void {
  cleanupPresent?.();
  cleanupPresent = null;
}

export async function renderPresent(
  root: HTMLElement,
  store: Store,
  bus: SyncBus,
  _sceneId?: string
): Promise<void> {
  disposePresent();

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

  const cleanupView = renderPresentView(root, {
    store,
    sync: bus,
    setScene,
    getRemainingSec,
    timerStartPause,
    timerReset
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

  cleanupPresent = () => {
    cleanupView();
    window.clearInterval(timerTick);
  };
}
