export type RouteName = "library" | "present" | "control";

export interface ParsedRoute {
  name: RouteName;
  query: URLSearchParams;
}

const ROUTE_MAP: Record<string, RouteName> = {
  "": "library",
  "/": "library",
  "/present": "present",
  "/control": "control",
};

export function parseHashRoute(hash = window.location.hash): ParsedRoute {
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [pathPart, queryPart = ""] = withoutHash.split("?");
  const normalizedPath = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const name = ROUTE_MAP[normalizedPath] ?? "library";
  return {
    name,
    query: new URLSearchParams(queryPart),
  };
}

export function navigate(path: string, query?: Record<string, string>): void {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(query ?? {});
  const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  url.hash = `${path}${querySuffix}`;
  window.location.href = url.toString();
}

export function onRouteChange(handler: () => void): () => void {
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
