import { getSceneById, OUTLINE } from "./data";
import { onRouteChange, parseHashRoute } from "./router";
import { setScene, subscribe, tickTimer } from "./state";
import { renderControlView } from "./views/control";
import { renderLibraryView } from "./views/library";
import { renderPresentView } from "./views/present";
import "../styles/base.css";
import "../styles/library.css";
import "../styles/present.css";
import "../styles/control.css";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) {
  throw new Error("App root not found.");
}
const app: HTMLDivElement = appElement;

let currentCleanup: (() => void) | null = null;

function renderRoute(): void {
  const route = parseHashRoute();
  const sceneParam = route.query.get("scene");
  if (sceneParam && getSceneById(sceneParam)) {
    setScene(sceneParam);
  }

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  app.innerHTML = "";

  if (route.name === "present") {
    currentCleanup = renderPresentView(app);
    return;
  }

  if (route.name === "control") {
    currentCleanup = renderControlView(app);
    return;
  }

  currentCleanup = renderLibraryView(app);
}

if (!window.location.hash) {
  window.location.hash = `/?scene=${OUTLINE.meta.defaultSceneId}`;
}

renderRoute();
const stopRouteListener = onRouteChange(renderRoute);

const timerInterval = window.setInterval(() => {
  tickTimer();
}, 1000);

window.addEventListener("beforeunload", () => {
  stopRouteListener();
  if (currentCleanup) {
    currentCleanup();
  }
  window.clearInterval(timerInterval);
});

subscribe(() => {
  // Views subscribe independently; this keeps state updates initialized.
});
