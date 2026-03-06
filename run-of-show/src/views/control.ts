import Fuse from "fuse.js";
import { getAdjacentScene, getFlatScenes, getSceneById, getSectionBySceneId } from "../data";
import { navigate } from "../router";
import { broadcast } from "../sync";
import {
  getState,
  resetTimer,
  setReducedMotion,
  setScene,
  setTimerPreset,
  setTimerRunning,
  stepFontScale,
  subscribe,
  toggleBlackScreen,
  toggleBookmark,
} from "../state";
import { renderConsoleScene } from "../components/sceneRenderer";
import { createSearchPicker } from "../components/searchPicker";
import { button, el } from "../components/ui";
import { renderTimer } from "../components/timer";

export function renderControlView(root: HTMLElement): () => void {
  document.body.dataset.route = "control";

  const scenes = getFlatScenes();
  const shell = el("main", "control-shell");
  const left = el("section", "control-main");
  const right = el("aside", "control-side");

  const sceneHost = el("div", "control-scene-host");
  left.appendChild(sceneHost);

  const status = el("p", "control-status");
  const topControls = el("div", "control-buttons");
  const prevBtn = button("Previous (K)");
  const nextBtn = button("Next (J)");
  const blackBtn = button("Black Screen (B)");
  const pickerBtn = button("Scene Picker (/)");
  topControls.append(prevBtn, nextBtn, blackBtn, pickerBtn);

  const answersWrap = el("div", "control-block");
  const answersToggle = button("Reveal Answers");
  answersWrap.append(el("h3", "control-title", "Answers"), answersToggle);

  const timerWrap = el("div", "control-block");
  const timerLabel = el("p", "control-timer");
  const timerControls = el("div", "control-buttons");
  const startBtn = button("Start");
  const pauseBtn = button("Pause");
  const resetBtn = button("Reset");
  timerControls.append(startBtn, pauseBtn, resetBtn);

  const presets = el("div", "control-buttons");
  const preset5 = button("5 min");
  const preset10 = button("10 min");
  const preset15 = button("15 min");
  presets.append(preset5, preset10, preset15);
  timerWrap.append(el("h3", "control-title", "Timer"), timerLabel, timerControls, presets);

  const settingsWrap = el("div", "control-block");
  const settingButtons = el("div", "control-buttons");
  const fontDown = button("A-");
  const fontUp = button("A+");
  const openPresent = button("Open Present Window");
  settingButtons.append(fontDown, fontUp, openPresent);
  const reducedMotionLabel = el("label", "control-check");
  const reducedMotion = document.createElement("input");
  reducedMotion.type = "checkbox";
  reducedMotionLabel.append(reducedMotion, document.createTextNode(" Reduced motion"));
  settingsWrap.append(el("h3", "control-title", "Display"), settingButtons, reducedMotionLabel);

  const quickWrap = el("div", "control-block");
  const bookmarkBtn = button("Toggle Bookmark");
  const bookmarksList = el("ul", "control-list");
  const recentList = el("ul", "control-list");
  quickWrap.append(
    el("h3", "control-title", "Quick Access"),
    bookmarkBtn,
    el("p", "control-sub", "Bookmarks"),
    bookmarksList,
    el("p", "control-sub", "Recent"),
    recentList,
  );

  const fuse = new Fuse(scenes, {
    keys: ["title", "script", "objective", "tags"],
    threshold: 0.32,
    ignoreLocation: true,
  });

  const picker = createSearchPicker(scenes, fuse, (sceneId) => {
    setScene(sceneId);
    broadcast({ type: "SET_SCENE", sceneId });
    navigate("/control", { scene: sceneId });
  });

  right.append(status, topControls, answersWrap, timerWrap, settingsWrap, quickWrap);
  shell.append(left, right, picker.mount);
  root.appendChild(shell);

  let answersVisible = false;

  function jump(offset: -1 | 1): void {
    const next = getAdjacentScene(getState().sceneId, offset);
    if (!next) {
      return;
    }
    setScene(next.id);
    broadcast({ type: "SET_SCENE", sceneId: next.id });
    navigate("/control", { scene: next.id });
  }

  function renderLists(): void {
    const state = getState();
    bookmarksList.innerHTML = "";
    recentList.innerHTML = "";

    state.bookmarks.forEach((id) => {
      const scene = getSceneById(id);
      if (!scene) {
        return;
      }
      const li = el("li", "control-list-item");
      const btn = button(scene.title, "btn subtle");
      btn.addEventListener("click", () => {
        setScene(id);
        broadcast({ type: "SET_SCENE", sceneId: id });
        navigate("/control", { scene: id });
      });
      li.appendChild(btn);
      bookmarksList.appendChild(li);
    });

    state.recent.forEach((id) => {
      const scene = getSceneById(id);
      if (!scene) {
        return;
      }
      const li = el("li", "control-list-item");
      const btn = button(scene.title, "btn subtle");
      btn.addEventListener("click", () => {
        setScene(id);
        broadcast({ type: "SET_SCENE", sceneId: id });
        navigate("/control", { scene: id });
      });
      li.appendChild(btn);
      recentList.appendChild(li);
    });
  }

  function update(): void {
    const state = getState();
    const scene = getSceneById(state.sceneId);
    if (!scene) {
      return;
    }

    document.documentElement.style.setProperty("--font-scale", String(state.settings.fontScale));

    sceneHost.innerHTML = "";
    sceneHost.appendChild(renderConsoleScene(scene, answersVisible));

    const section = getSectionBySceneId(scene.id);
    status.textContent = `${section?.title ?? "Section"} | Scene: ${scene.title} | Black: ${
      state.blackScreen ? "On" : "Off"
    }`;

    timerLabel.textContent = renderTimer(state.timer.elapsedSeconds, state.timer.presetMinutes);
    reducedMotion.checked = state.settings.reducedMotion;
    renderLists();
  }

  function onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === "j") {
      event.preventDefault();
      jump(1);
      return;
    }
    if (key === "k") {
      event.preventDefault();
      jump(-1);
      return;
    }
    if (key === "b") {
      event.preventDefault();
      toggleBlackScreen();
      broadcast({ type: "TOGGLE_BLACK" });
      return;
    }
    if (event.key === "/") {
      event.preventDefault();
      picker.open();
    }
  }

  prevBtn.addEventListener("click", () => jump(-1));
  nextBtn.addEventListener("click", () => jump(1));
  blackBtn.addEventListener("click", () => {
    toggleBlackScreen();
    broadcast({ type: "TOGGLE_BLACK" });
  });
  pickerBtn.addEventListener("click", () => picker.open());

  answersToggle.addEventListener("click", () => {
    answersVisible = !answersVisible;
    answersToggle.textContent = answersVisible ? "Hide Answers" : "Reveal Answers";
    update();
  });

  startBtn.addEventListener("click", () => {
    setTimerRunning(true);
    broadcast({ type: "TIMER_START" });
  });
  pauseBtn.addEventListener("click", () => {
    setTimerRunning(false);
    broadcast({ type: "TIMER_PAUSE" });
  });
  resetBtn.addEventListener("click", () => {
    resetTimer();
    broadcast({ type: "TIMER_RESET" });
  });

  preset5.addEventListener("click", () => setTimerPreset(5));
  preset10.addEventListener("click", () => setTimerPreset(10));
  preset15.addEventListener("click", () => setTimerPreset(15));

  fontDown.addEventListener("click", () => {
    stepFontScale(-0.1);
    broadcast({ type: "SET_FONT_SCALE", value: getState().settings.fontScale });
  });
  fontUp.addEventListener("click", () => {
    stepFontScale(0.1);
    broadcast({ type: "SET_FONT_SCALE", value: getState().settings.fontScale });
  });

  openPresent.addEventListener("click", () => {
    const sceneId = getState().sceneId;
    const url = `${window.location.origin}${window.location.pathname}#/present?scene=${sceneId}`;
    window.open(url, "run-of-show-present", "popup,width=1440,height=900");
  });

  reducedMotion.addEventListener("change", () => {
    setReducedMotion(reducedMotion.checked);
  });

  bookmarkBtn.addEventListener("click", () => {
    toggleBookmark(getState().sceneId);
  });

  document.addEventListener("keydown", onKeyDown);
  const unsubscribe = subscribe(update);
  update();

  return () => {
    unsubscribe();
    document.removeEventListener("keydown", onKeyDown);
  };
}
