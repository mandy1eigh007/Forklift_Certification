import Fuse from "fuse.js";

export type MediaItem =
  | { type: "image"; title: string; src: string }
  | { type: "video"; title: string; src: string }
  | { type: "link"; title: string; src: string };

export type OutlineMeta = {
  title: string;
  version: string;
  updated: string;
  defaultSceneId: string;
};

export type Scene = {
  id: string;
  template?: "standard" | "visual" | "compare";
  title: string;
  durationMinutes: number;
  objective: string;
  script: string;
  steps: string[];
  ask: string[];
  watchFor: string[];
  media: MediaItem[];
  links: { title: string; url: string }[];
  answers?: { enabled: boolean; items: string[] };
  notes?: string;
  tags?: string[];
};

export type Section = {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
};

export type Outline = {
  meta: OutlineMeta;
  sections: Section[];
};

export type FlatScene = Scene & { sectionId: string; sectionTitle: string; index: number };

export type SearchHit = {
  id: string;
  title: string;
  sectionTitle: string;
  objective: string;
  tags: string[];
};

export type OutlineLoadError = {
  message: string;
  details: string[];
};

let cached: {
  outline: Outline;
  flat: FlatScene[];
  byId: Map<string, FlatScene>;
  fuse: Fuse<SearchHit>;
} | null = null;
let loadError: OutlineLoadError | null = null;

function baseUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}${path.replace(/^\//, "")}`;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidDuration(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function validateOutlineShape(raw: unknown): OutlineLoadError | null {
  const errors: string[] = [];
  const obj = raw as Record<string, unknown>;
  const meta = obj?.meta as Record<string, unknown> | undefined;
  const sections = obj?.sections;

  if (!meta || typeof meta !== "object") {
    errors.push("Missing `meta` object.");
  } else if (!isNonEmptyString(meta.defaultSceneId)) {
    errors.push("Missing `meta.defaultSceneId`.");
  }

  if (!Array.isArray(sections)) {
    errors.push("`sections` must be an array.");
  } else {
    sections.forEach((section, secIdx) => {
      const s = section as Record<string, unknown>;
      const scenes = s?.scenes;
      if (!Array.isArray(scenes)) {
        errors.push(`sections[${secIdx}].scenes must be an array.`);
        return;
      }
      scenes.forEach((scene, sceneIdx) => {
        const sc = scene as Record<string, unknown>;
        const path = `sections[${secIdx}].scenes[${sceneIdx}]`;
        if (!isNonEmptyString(sc.id)) errors.push(`${path}.id is required.`);
        if (!isNonEmptyString(sc.title)) errors.push(`${path}.title is required.`);
        if (!isValidDuration(sc.durationMinutes)) errors.push(`${path}.durationMinutes must be a positive number.`);
        if (!isNonEmptyString(sc.objective)) errors.push(`${path}.objective is required.`);
        if (!isNonEmptyString(sc.script)) errors.push(`${path}.script is required.`);
      });
    });
  }

  return errors.length ? { message: "Outline data error.", details: errors } : null;
}

export function getOutlineError(): OutlineLoadError | null {
  return loadError;
}

export async function loadOutline(): Promise<Outline | null> {
  if (cached) return cached.outline;
  if (loadError) return null;

  try {
    const res = await fetch(baseUrl("content/outline.json"), { cache: "no-store" });
    if (!res.ok) {
      loadError = {
        message: "Outline data error.",
        details: [`Failed to load content/outline.json: HTTP ${res.status}`]
      };
      console.error("Outline data error. Fix public/content/outline.json.", loadError.details);
      return null;
    }
    const raw = (await res.json()) as unknown;
    const schemaError = validateOutlineShape(raw);
    if (schemaError) {
      loadError = schemaError;
      console.error("Outline data error. Fix public/content/outline.json.", schemaError.details);
      return null;
    }
    const outline = raw as Outline;

    const sections = [...outline.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const flat: FlatScene[] = [];
    for (const sec of sections) {
      for (const sc of sec.scenes) {
        flat.push({
          ...sc,
          sectionId: sec.id,
          sectionTitle: sec.title,
          index: flat.length
        });
      }
    }

    const byId = new Map<string, FlatScene>();
    flat.forEach((s) => byId.set(s.id, s));
    if (!byId.has(outline.meta.defaultSceneId)) {
      loadError = {
        message: "Outline data error.",
        details: [`meta.defaultSceneId '${outline.meta.defaultSceneId}' does not exist in scenes.`]
      };
      console.error("Outline data error. Fix public/content/outline.json.", loadError.details);
      return null;
    }

    const hits: SearchHit[] = flat.map((s) => ({
      id: s.id,
      title: s.title,
      sectionTitle: s.sectionTitle,
      objective: s.objective ?? "",
      tags: s.tags ?? []
    }));

    const fuse = new Fuse(hits, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      keys: [
        { name: "title", weight: 0.55 },
        { name: "sectionTitle", weight: 0.25 },
        { name: "objective", weight: 0.15 },
        { name: "tags", weight: 0.05 }
      ]
    });

    cached = { outline: { ...outline, sections }, flat, byId, fuse };
    return cached.outline;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error while loading outline.";
    loadError = {
      message: "Outline data error.",
      details: [detail]
    };
    console.error("Outline data error. Fix public/content/outline.json.", loadError.details);
    return null;
  }
}

export function getFlatScenes(): FlatScene[] {
  if (!cached) throw new Error("Outline not loaded. Call loadOutline() first.");
  return cached.flat;
}

export function getSceneById(id: string): FlatScene | null {
  if (!cached) throw new Error("Outline not loaded. Call loadOutline() first.");
  return cached.byId.get(id) ?? null;
}

export function getDefaultSceneId(): string {
  if (!cached) throw new Error("Outline not loaded. Call loadOutline() first.");
  const d = cached.outline.meta.defaultSceneId;
  return cached.byId.has(d) ? d : cached.flat[0]?.id ?? "";
}

export function getNextSceneId(currentId: string): string {
  const s = getSceneById(currentId);
  const flat = getFlatScenes();
  if (!s) return getDefaultSceneId();
  return flat[Math.min(flat.length - 1, s.index + 1)]?.id ?? s.id;
}

export function getPrevSceneId(currentId: string): string {
  const s = getSceneById(currentId);
  const flat = getFlatScenes();
  if (!s) return getDefaultSceneId();
  return flat[Math.max(0, s.index - 1)]?.id ?? s.id;
}

export function searchScenes(query: string, limit = 20): SearchHit[] {
  if (!cached) throw new Error("Outline not loaded. Call loadOutline() first.");
  const q = query.trim();
  if (!q) return cached.flat.slice(0, limit).map((s) => ({
    id: s.id,
    title: s.title,
    sectionTitle: s.sectionTitle,
    objective: s.objective ?? "",
    tags: s.tags ?? []
  }));

  return cached.fuse.search(q).slice(0, limit).map((r) => r.item);
}
