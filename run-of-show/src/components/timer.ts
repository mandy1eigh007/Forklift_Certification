import { formatMMSS } from "./ui";

export function renderTimer(elapsedSeconds: number, presetMinutes: number): string {
  const remaining = Math.max(0, presetMinutes * 60 - elapsedSeconds);
  return `${formatMMSS(elapsedSeconds)} / ${formatMMSS(presetMinutes * 60)} (left ${formatMMSS(remaining)})`;
}
