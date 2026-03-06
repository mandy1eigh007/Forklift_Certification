import {
  resetTimer,
  setFontScale,
  setScene,
  setTimerRunning,
  toggleBlackScreen,
} from "./state";

export type SyncMessage =
  | { type: "SET_SCENE"; sceneId: string }
  | { type: "TOGGLE_BLACK" }
  | { type: "TIMER_START" }
  | { type: "TIMER_PAUSE" }
  | { type: "TIMER_RESET" }
  | { type: "SET_FONT_SCALE"; value: number };

const CHANNEL_NAME = "runofshow";
const STORAGE_KEY = "ros.sync-message";

let channel: BroadcastChannel | null = null;

try {
  channel = new BroadcastChannel(CHANNEL_NAME);
} catch {
  channel = null;
}

function handleMessage(message: SyncMessage): void {
  switch (message.type) {
    case "SET_SCENE":
      setScene(message.sceneId);
      break;
    case "TOGGLE_BLACK":
      toggleBlackScreen();
      break;
    case "TIMER_START":
      setTimerRunning(true);
      break;
    case "TIMER_PAUSE":
      setTimerRunning(false);
      break;
    case "TIMER_RESET":
      resetTimer();
      break;
    case "SET_FONT_SCALE":
      setFontScale(message.value);
      break;
    default:
      break;
  }
}

if (channel) {
  channel.onmessage = (event: MessageEvent<SyncMessage>) => {
    handleMessage(event.data);
  };
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) {
    return;
  }
  try {
    const message = JSON.parse(event.newValue) as SyncMessage;
    handleMessage(message);
  } catch {
    // Ignore malformed sync payloads.
  }
});

export function broadcast(message: SyncMessage): void {
  if (channel) {
    channel.postMessage(message);
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...message, sentAt: Date.now(), nonce: Math.random().toString(36).slice(2) }),
  );
}
