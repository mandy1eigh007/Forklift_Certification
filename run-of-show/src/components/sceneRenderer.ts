import type { Scene } from "../data";
import { el } from "./ui";

export function renderPresentScene(scene: Scene): HTMLElement {
  const wrap = el("section", "scene-present");

  const title = el("h1", "scene-title", scene.title);
  wrap.appendChild(title);

  const objective = el("p", "scene-objective", scene.objective);
  wrap.appendChild(objective);

  const script = el("p", "scene-script", scene.script);
  wrap.appendChild(script);

  const leadMedia = scene.media.find((item) => item.type === "image" || item.type === "video");
  if (leadMedia) {
    const mediaWrap = el("div", "scene-media-hero");
    mediaWrap.appendChild(renderMediaItem(leadMedia, true));
    wrap.appendChild(mediaWrap);
  }

  const stepsTitle = el("h2", "scene-subtitle", "Steps");
  wrap.appendChild(stepsTitle);

  const stepList = el("ol", "scene-list");
  scene.steps.slice(0, 5).forEach((item) => {
    const li = el("li", "scene-list-item", item);
    stepList.appendChild(li);
  });
  if (scene.steps.length > 5) {
    stepList.appendChild(el("li", "scene-list-item scene-truncated", "More in Console."));
  }
  wrap.appendChild(stepList);

  if (scene.ask[0]) {
    const askTitle = el("h2", "scene-subtitle", "Prompt");
    const ask = el("p", "scene-ask", scene.ask[0]);
    wrap.append(askTitle, ask);
  }

  if (scene.watchFor[0]) {
    const watchTitle = el("h2", "scene-subtitle scene-watch", "Watch For");
    const watch = el("p", "scene-watch-body", scene.watchFor[0]);
    wrap.append(watchTitle, watch);
  }

  return wrap;
}

export function renderConsoleScene(scene: Scene, answersVisible: boolean): HTMLElement {
  const wrap = el("section", "scene-console");

  const title = el("h1", "scene-title", scene.title);
  const objective = el("p", "scene-objective", scene.objective);
  const script = el("p", "scene-script", scene.script);

  wrap.append(title, objective, script);

  wrap.appendChild(sectionList("Steps", scene.steps));
  wrap.appendChild(sectionList("Ask", scene.ask));
  wrap.appendChild(sectionList("Watch For", scene.watchFor, true));

  const links = el("div", "scene-links");
  const linksTitle = el("h2", "scene-subtitle", "Quick Links");
  links.appendChild(linksTitle);
  if (scene.links.length === 0) {
    links.appendChild(el("p", "scene-muted", "No links attached."));
  } else {
    const ul = el("ul", "scene-list");
    scene.links.forEach((item) => {
      const li = el("li", "scene-list-item");
      const a = document.createElement("a");
      a.className = "scene-link";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.title;
      li.appendChild(a);
      ul.appendChild(li);
    });
    links.appendChild(ul);
  }
  wrap.appendChild(links);

  const media = el("div", "scene-media");
  media.appendChild(el("h2", "scene-subtitle", "Media"));
  if (scene.media.length === 0) {
    media.appendChild(el("p", "scene-muted", "No media attached."));
  } else {
    const ul = el("ul", "scene-media-list");
    scene.media.forEach((item) => {
      const li = el("li", "scene-media-item");
      li.appendChild(renderMediaItem(item, false));
      ul.appendChild(li);
    });
    media.appendChild(ul);
  }
  wrap.appendChild(media);

  const notes = el("div", "scene-notes");
  notes.appendChild(el("h2", "scene-subtitle", "Speaker Notes"));
  notes.appendChild(el("p", "scene-notes-text", scene.notes));
  wrap.appendChild(notes);

  const answersBlock = el("div", "scene-answers");
  answersBlock.appendChild(el("h2", "scene-subtitle", "Answers"));
  if (!scene.answers || !scene.answers.enabled) {
    answersBlock.appendChild(el("p", "scene-muted", "No hidden answers for this scene."));
  } else if (!answersVisible) {
    answersBlock.appendChild(el("p", "scene-muted", "Answers hidden. Use reveal toggle in Console."));
  } else {
    const list = el("ul", "scene-list");
    scene.answers.items.forEach((item) => {
      list.appendChild(el("li", "scene-list-item", item));
    });
    answersBlock.appendChild(list);
  }
  wrap.appendChild(answersBlock);

  return wrap;
}

function renderMediaItem(item: Scene["media"][number], eager: boolean): HTMLElement {
  const card = el("figure", "scene-media-card");
  const caption = el("figcaption", "scene-media-caption", item.title);

  if (item.type === "image") {
    const optimized = getOptimizedImagePaths(item.src);
    if (optimized) {
      const picture = document.createElement("picture");
      const avif = document.createElement("source");
      avif.type = "image/avif";
      avif.srcset = optimized.avif;
      const webp = document.createElement("source");
      webp.type = "image/webp";
      webp.srcset = optimized.webp;

      const image = document.createElement("img");
      image.src = optimized.fallback;
      image.alt = item.title;
      image.loading = eager ? "eager" : "lazy";
      image.decoding = "async";
      image.className = "scene-media-image";

      picture.append(avif, webp, image);
      card.append(picture, caption);
      return card;
    }

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title;
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    image.className = "scene-media-image";
    card.append(image, caption);
    return card;
  }

  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.controls = true;
    video.preload = "metadata";
    video.className = "scene-media-video";
    card.append(video, caption);
    return card;
  }

  const link = document.createElement("a");
  link.href = item.src;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "scene-link scene-media-link";
  link.textContent = "Open linked resource";
  card.append(link, caption);
  return card;
}

function getOptimizedImagePaths(src: string): { avif: string; webp: string; fallback: string } | null {
  const match = src.match(/^uploads\/(image\d+)\.png$/i);
  if (!match) {
    return null;
  }
  const name = match[1];
  return {
    avif: `uploads/avif/${name}.avif`,
    webp: `uploads/webp/${name}.webp`,
    fallback: src,
  };
}

function sectionList(title: string, items: string[], warn = false): HTMLElement {
  const block = el("div", "scene-block");
  const header = el("h2", warn ? "scene-subtitle scene-watch" : "scene-subtitle", title);
  block.appendChild(header);

  if (items.length === 0) {
    block.appendChild(el("p", "scene-muted", "None."));
    return block;
  }

  const list = el("ul", "scene-list");
  items.forEach((item) => {
    list.appendChild(el("li", "scene-list-item", item));
  });
  block.appendChild(list);

  return block;
}
