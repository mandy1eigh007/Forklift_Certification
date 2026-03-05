import outline from "../content/outline.json";

export type MediaType = "image" | "video" | "link";

export interface MediaItem {
  type: MediaType;
  title: string;
  src: string;
}

export interface ExternalLink {
  title: string;
  url: string;
}

export interface Answers {
  enabled: boolean;
  items: string[];
}

export interface Scene {
  id: string;
  title: string;
  durationMinutes: number;
  objective: string;
  script: string;
  steps: string[];
  ask: string[];
  watchFor: string[];
  media: MediaItem[];
  links: ExternalLink[];
  answers?: Answers;
  notes: string;
  tags: string[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
}

export interface OutlineMeta {
  title: string;
  version: string;
  updated: string;
  defaultSceneId: string;
}

export interface Outline {
  meta: OutlineMeta;
  sections: Section[];
}

export const OUTLINE: Outline = outline as Outline;

const SCENE_LOOKUP = new Map<string, { section: Section; scene: Scene; index: number }>();
const FLAT_SCENES: Scene[] = [];

OUTLINE.sections
  .slice()
  .sort((a, b) => a.order - b.order)
  .forEach((section) => {
    section.scenes.forEach((scene) => {
      const index = FLAT_SCENES.length;
      FLAT_SCENES.push(scene);
      SCENE_LOOKUP.set(scene.id, { section, scene, index });
    });
  });

export function getFlatScenes(): Scene[] {
  return FLAT_SCENES;
}

export function getSceneById(sceneId: string): Scene | null {
  const entry = SCENE_LOOKUP.get(sceneId);
  return entry ? entry.scene : null;
}

export function getSectionBySceneId(sceneId: string): Section | null {
  const entry = SCENE_LOOKUP.get(sceneId);
  return entry ? entry.section : null;
}

export function getSceneIndex(sceneId: string): number {
  const entry = SCENE_LOOKUP.get(sceneId);
  return entry ? entry.index : -1;
}

export function getSceneByIndex(index: number): Scene | null {
  if (index < 0 || index >= FLAT_SCENES.length) {
    return null;
  }
  return FLAT_SCENES[index];
}

export function getAdjacentScene(sceneId: string, offset: -1 | 1): Scene | null {
  const index = getSceneIndex(sceneId);
  if (index < 0) {
    return null;
  }
  return getSceneByIndex(index + offset);
}
