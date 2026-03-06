export type SyncMessage =
  | { type: "SET_SCENE"; sceneId: string }
  | { type: "SET_BLACK"; value: boolean }
  | { type: "SET_FONT_SCALE"; value: number }
  | { type: "TIMER_START"; endsAtMs: number }
  | { type: "TIMER_PAUSE"; remainingSec: number }
  | { type: "TIMER_RESET" };

type Handler = (msg: SyncMessage) => void;

const CHANNEL = "runofshow";
const FALLBACK_KEY = "runofshow.sync.v1";

export class SyncBus {
  private bc: BroadcastChannel | null = null;
  private handler: Handler | null = null;

  init(handler: Handler): void {
    this.handler = handler;

    if ("BroadcastChannel" in window) {
      this.bc = new BroadcastChannel(CHANNEL);
      this.bc.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as SyncMessage;
        this.handler?.(msg);
      };
    }

    window.addEventListener("storage", (ev) => {
      if (ev.key !== FALLBACK_KEY || !ev.newValue) return;
      try {
        const parsed = JSON.parse(ev.newValue) as { msg: SyncMessage };
        this.handler?.(parsed.msg);
      } catch {
        return;
      }
    });
  }

  send(msg: SyncMessage): void {
    // Primary
    this.bc?.postMessage(msg);

    // Fallback: storage event for other tabs
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify({ msg, t: Date.now(), n: Math.random() }));
    } catch {
      // ignore
    }
  }

  destroy(): void {
    if (this.bc) this.bc.close();
    this.bc = null;
    this.handler = null;
  }
}
