import "./../styles/base.css";
import "./../styles/library.css";
import "./../styles/present.css";
import "./../styles/control.css";

import { getDefaultSceneId, getOutlineError, getSceneById, loadOutline } from "./data";
import { getRouteFromHash } from "./router";
import { Store, loadState } from "./state";
import { SyncBus } from "./sync";
import { renderLibrary } from "./views/library";
import { disposePresent, renderPresent } from "./views/present";
import { disposeControl, renderControl } from "./views/control";
import { clear, el, qs } from "./components/ui";

async function boot(): Promise<void> {
  const loaded = await loadOutline();
  const outlineError = getOutlineError();
  if (!loaded || outlineError) {
    const app = qs<HTMLElement>("#app");
    clear(app);
    const wrap = el("div", { className: "container" });
    const card = el("section", { className: "card" });
    card.appendChild(el("h1", { text: "Outline data error. Fix public/content/outline.json." }));
    if (outlineError?.details?.length) {
      const ul = el("ul");
      outlineError.details.forEach((d) => ul.appendChild(el("li", { text: d })));
      card.appendChild(ul);
    } else {
      card.appendChild(el("p", { text: "Unable to load outline data." }));
    }
    wrap.appendChild(card);
    app.appendChild(wrap);
    return;
  }

  const defaultSceneId = getDefaultSceneId();

  const store = new Store(loadState(defaultSceneId));
  const bus = new SyncBus();

  bus.init((msg) => {
    switch (msg.type) {
      case "SET_SCENE":
        if (getSceneById(msg.sceneId)) store.set({ sceneId: msg.sceneId });
        break;
      case "SET_BLACK":
        store.update((s) => ({ ...s, settings: { ...s.settings, blackScreen: msg.value } }));
        break;
      case "SET_FONT_SCALE":
        store.update((s) => ({ ...s, settings: { ...s.settings, fontScale: msg.value } }));
        break;
      case "TIMER_START":
        {
          const remainingSec = Math.max(0, Math.ceil((msg.endsAtMs - Date.now()) / 1000));
          store.set({
            timer: { mode: "running", remainingSec, endsAtMs: msg.endsAtMs }
          });
        }
        break;
      case "TIMER_PAUSE":
        store.set({
          timer: { mode: "paused", remainingSec: Math.max(0, msg.remainingSec), endsAtMs: null }
        });
        break;
      case "TIMER_RESET":
        store.set({ timer: { mode: "idle", remainingSec: 0, endsAtMs: null } });
        break;
    }
  });

  const app = qs<HTMLElement>("#app");

  const render = async () => {
    disposePresent();
    disposeControl();
    clear(app);

    const route = getRouteFromHash(location.hash);
    const sceneId = route.sceneId && getSceneById(route.sceneId) ? route.sceneId : undefined;

    if (route.name === "present") {
      if (sceneId) store.set({ sceneId });
      await renderPresent(app, store, bus, sceneId);
      return;
    }

    if (route.name === "control") {
      if (sceneId) store.set({ sceneId });
      await renderControl(app, store, bus, sceneId);
      return;
    }

    await renderLibrary(app, store);
  };

  window.addEventListener("hashchange", () => void render());

  if (!location.hash) location.hash = "#/";
  await render();
}

void boot();
