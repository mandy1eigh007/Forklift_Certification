export type Route =
  | { name: "library"; sceneId?: string }
  | { name: "present"; sceneId?: string }
  | { name: "control"; sceneId?: string };

function parseQuery(qs: string): Record<string, string> {
  const out: Record<string, string> = {};
  const s = qs.replace(/^\?/, "");
  if (!s) return out;
  for (const part of s.split("&")) {
    const [k, v] = part.split("=");
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return out;
}

export function getRouteFromHash(hash: string): Route {
  // examples:
  // #/present?scene=s01
  // #/control?scene=s02
  // #/
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const [pathPart, queryPart] = h.split("?");
  const path = (pathPart || "/").replace(/^\/?/, "/");
  const query = parseQuery(queryPart ?? "");
  const sceneId = query.scene || undefined;

  if (path.startsWith("/present")) return { name: "present", sceneId };
  if (path.startsWith("/control")) return { name: "control", sceneId };
  return { name: "library", sceneId };
}

export function setHashRoute(name: Route["name"], sceneId?: string): void {
  const q = sceneId ? `?scene=${encodeURIComponent(sceneId)}` : "";
  location.hash = `#/${name}${q}`;
}
