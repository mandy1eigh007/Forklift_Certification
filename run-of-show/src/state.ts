export type ViewName = "library" | "present" | "control";

export type Settings = {
  fontScale: number;        // 0.8..1.4
  blackScreen: boolean;
  reduceMotion: boolean;
};

export type TimerState =
  | { mode: "idle"; remainingSec: number; endsAtMs: number | null }
  | { mode: "running"; remainingSec: number; endsAtMs: number }
  | { mode: "paused"; remainingSec: number; endsAtMs: number | null };

export type AppState = {
  sceneId: string;
  settings: Settings;
  bookmarks: string[];
  recent: string[];
  timer: TimerState;
};

const STORAGE_KEY = "runofshow.state.v1";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && "matchMedia" in window
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function defaultState(defaultSceneId: string): AppState {
  return {
    sceneId: defaultSceneId,
    settings: {
      fontScale: 1,
      blackScreen: false,
      reduceMotion: prefersReducedMotion()
    },
    bookmarks: [],
    recent: [],
    timer: { mode: "idle", remainingSec: 0, endsAtMs: null }
  };
}

export function loadState(defaultSceneId: string): AppState {
  const base = defaultState(defaultSceneId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      timer: parsed.timer ?? base.timer
    };
  } catch {
    return base;
  }
}

export function saveState(s: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

type Listener = (s: AppState) => void;

export class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor(initial: AppState) {
    this.state = initial;
  }

  get(): AppState {
    return this.state;
  }

  set(patch: Partial<AppState>): void {
    this.state = {
      ...this.state,
      ...patch,
      settings: patch.settings ? { ...this.state.settings, ...patch.settings } : this.state.settings
    };
    saveState(this.state);
    this.emit();
  }

  update(fn: (s: AppState) => AppState): void {
    this.state = fn(this.state);
    saveState(this.state);
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }
}

export function pushRecent(s: AppState, sceneId: string, max = 10): AppState {
  const next = [sceneId, ...s.recent.filter((x) => x !== sceneId)].slice(0, max);
  return { ...s, recent: next };
}

export function toggleBookmark(s: AppState, sceneId: string): AppState {
  const has = s.bookmarks.includes(sceneId);
  const next = has ? s.bookmarks.filter((x) => x !== sceneId) : [sceneId, ...s.bookmarks];
  return { ...s, bookmarks: next };
}

export function clampFontScale(n: number): number {
  return Math.max(0.8, Math.min(1.4, Math.round(n * 10) / 10));
}
