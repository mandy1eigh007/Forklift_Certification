import { OUTLINE, getSceneById } from "./data";

const STORAGE_KEYS = {
  sceneId: "ros.currentSceneId",
  fontScale: "ros.fontScale",
  blackScreen: "ros.blackScreen",
  reducedMotion: "ros.reducedMotion",
  bookmarks: "ros.bookmarks",
  recent: "ros.recent",
  timerSeconds: "ros.timerSeconds",
  timerRunning: "ros.timerRunning",
  timerPreset: "ros.timerPreset",
};

export interface AppSettings {
  fontScale: number;
  reducedMotion: boolean;
}

export interface TimerState {
  elapsedSeconds: number;
  running: boolean;
  presetMinutes: number;
}

export interface AppState {
  sceneId: string;
  blackScreen: boolean;
  settings: AppSettings;
  bookmarks: string[];
  recent: string[];
  timer: TimerState;
}

type Listener = (state: AppState) => void;

function readJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state: AppState = {
  sceneId: localStorage.getItem(STORAGE_KEYS.sceneId) ?? OUTLINE.meta.defaultSceneId,
  blackScreen: localStorage.getItem(STORAGE_KEYS.blackScreen) === "true",
  settings: {
    fontScale: Number(localStorage.getItem(STORAGE_KEYS.fontScale) ?? "1") || 1,
    reducedMotion: localStorage.getItem(STORAGE_KEYS.reducedMotion)
      ? localStorage.getItem(STORAGE_KEYS.reducedMotion) === "true"
      : prefersReducedMotion,
  },
  bookmarks: readJSON(STORAGE_KEYS.bookmarks, []),
  recent: readJSON(STORAGE_KEYS.recent, []),
  timer: {
    elapsedSeconds: Number(localStorage.getItem(STORAGE_KEYS.timerSeconds) ?? "0") || 0,
    running: localStorage.getItem(STORAGE_KEYS.timerRunning) === "true",
    presetMinutes: Number(localStorage.getItem(STORAGE_KEYS.timerPreset) ?? "10") || 10,
  },
};

if (!getSceneById(state.sceneId)) {
  state.sceneId = OUTLINE.meta.defaultSceneId;
}

const listeners = new Set<Listener>();

function persistState(): void {
  localStorage.setItem(STORAGE_KEYS.sceneId, state.sceneId);
  localStorage.setItem(STORAGE_KEYS.blackScreen, String(state.blackScreen));
  localStorage.setItem(STORAGE_KEYS.fontScale, state.settings.fontScale.toFixed(2));
  localStorage.setItem(STORAGE_KEYS.reducedMotion, String(state.settings.reducedMotion));
  writeJSON(STORAGE_KEYS.bookmarks, state.bookmarks);
  writeJSON(STORAGE_KEYS.recent, state.recent);
  localStorage.setItem(STORAGE_KEYS.timerSeconds, String(state.timer.elapsedSeconds));
  localStorage.setItem(STORAGE_KEYS.timerRunning, String(state.timer.running));
  localStorage.setItem(STORAGE_KEYS.timerPreset, String(state.timer.presetMinutes));
}

function emit(): void {
  persistState();
  listeners.forEach((listener) => listener(getState()));
}

export function getState(): AppState {
  return {
    sceneId: state.sceneId,
    blackScreen: state.blackScreen,
    settings: { ...state.settings },
    bookmarks: [...state.bookmarks],
    recent: [...state.recent],
    timer: { ...state.timer },
  };
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setScene(sceneId: string): void {
  if (!getSceneById(sceneId) || state.sceneId === sceneId) {
    return;
  }
  state.sceneId = sceneId;
  state.recent = [sceneId, ...state.recent.filter((id) => id !== sceneId)].slice(0, 12);
  emit();
}

export function setBlackScreen(enabled: boolean): void {
  if (state.blackScreen === enabled) {
    return;
  }
  state.blackScreen = enabled;
  emit();
}

export function toggleBlackScreen(): void {
  setBlackScreen(!state.blackScreen);
}

export function setFontScale(next: number): void {
  const clamped = Math.min(1.6, Math.max(0.8, Number(next.toFixed(2))));
  if (state.settings.fontScale === clamped) {
    return;
  }
  state.settings.fontScale = clamped;
  emit();
}

export function stepFontScale(delta: number): void {
  setFontScale(state.settings.fontScale + delta);
}

export function setReducedMotion(enabled: boolean): void {
  if (state.settings.reducedMotion === enabled) {
    return;
  }
  state.settings.reducedMotion = enabled;
  emit();
}

export function toggleBookmark(sceneId: string): void {
  if (!getSceneById(sceneId)) {
    return;
  }
  if (state.bookmarks.includes(sceneId)) {
    state.bookmarks = state.bookmarks.filter((id) => id !== sceneId);
  } else {
    state.bookmarks = [sceneId, ...state.bookmarks];
  }
  emit();
}

export function setTimerRunning(running: boolean): void {
  if (state.timer.running === running) {
    return;
  }
  state.timer.running = running;
  emit();
}

export function toggleTimerRunning(): void {
  setTimerRunning(!state.timer.running);
}

export function resetTimer(): void {
  state.timer.elapsedSeconds = 0;
  state.timer.running = false;
  emit();
}

export function tickTimer(seconds = 1): void {
  if (!state.timer.running) {
    return;
  }
  state.timer.elapsedSeconds += seconds;
  emit();
}

export function setTimerPreset(minutes: number): void {
  const clamped = Math.max(1, Math.min(180, Math.round(minutes)));
  if (state.timer.presetMinutes === clamped) {
    return;
  }
  state.timer.presetMinutes = clamped;
  emit();
}
