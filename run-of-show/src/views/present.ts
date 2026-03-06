import Fuse from "fuse.js";
import { getAdjacentScene, getFlatScenes, getSceneById, getSectionBySceneId } from "../data";
import { navigate } from "../router";
import { broadcast } from "../sync";
import { getState, setScene, subscribe, toggleBlackScreen } from "../state";
import { renderPresentScene } from "../components/sceneRenderer";
import { createSearchPicker } from "../components/searchPicker";
import { el } from "../components/ui";
import { renderTimer } from "../components/timer";

export function renderPresentView(root: HTMLElement): () => void {
  document.body.dataset.route = "present";

  const shell = el("main", "present-shell");
  const content = el("div", "present-content");
  const hud = el("footer", "present-hud");
  const blackOverlay = el("div", "black-overlay hidden");
  blackOverlay.textContent = "Black Screen";

  const scenes = getFlatScenes();
  const fuse = new Fuse(scenes, {
    keys: ["title", "script", "objective", "tags"],
    threshold: 0.32,
    ignoreLocation: true,
  });

  const picker = createSearchPicker(scenes, fuse, (sceneId) => {
    setScene(sceneId);
    broadcast({ type: "SET_SCENE", sceneId });
    navigate("/present", { scene: sceneId });
  });

  function update(): void {
    const state = getState();
    const scene = getSceneById(state.sceneId);
    if (!scene) {
      return;
    }

    document.documentElement.style.setProperty("--font-scale", String(state.settings.fontScale));
    document.documentElement.dataset.reducedMotion = String(state.settings.reducedMotion);

    content.innerHTML = "";
    content.appendChild(renderPresentScene(scene));

    const section = getSectionBySceneId(scene.id);
    const currentIndex = scenes.findIndex((item) => item.id === scene.id) + 1;
    hud.textContent = `${section?.title ?? "Section"} | ${currentIndex}/${scenes.length} | ${renderTimer(
      state.timer.elapsedSeconds,
      state.timer.presetMinutes,
    )}`;

    blackOverlay.classList.toggle("hidden", !state.blackScreen);
  }

  function go(offset: -1 | 1): void {
    const state = getState();
    const next = getAdjacentScene(state.sceneId, offset);
    if (!next) {
      return;
    }
    setScene(next.id);
    broadcast({ type: "SET_SCENE", sceneId: next.id });
    navigate("/present", { scene: next.id });
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "/") {
      event.preventDefault();
      picker.open();
      return;
    }

    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggleBlackScreen();
      broadcast({ type: "TOGGLE_BLACK" });
      return;
    }

    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      document.documentElement.requestFullscreen().catch(() => {
        // Ignore fullscreen rejection from browser policies.
      });
      return;
    }

    if (event.key === " " || event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  }

  shell.append(content, hud, blackOverlay, picker.mount);
  root.appendChild(shell);

  update();
  const unsubscribe = subscribe(update);
  document.addEventListener("keydown", onKeyDown);

  return () => {
    unsubscribe();
    document.removeEventListener("keydown", onKeyDown);
  };
}
