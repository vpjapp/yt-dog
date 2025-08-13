export type WatchedState = {
  watched: Record<string, number>; // videoId -> timestamp ms
  skipped: Record<string, number>;
};

const KEY = "yt-dog:state";

export function loadState(): WatchedState {
  if (typeof window === "undefined") return { watched: {}, skipped: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { watched: {}, skipped: {} };
    const parsed = JSON.parse(raw) as WatchedState;
    return { watched: parsed.watched || {}, skipped: parsed.skipped || {} };
  } catch {
    return { watched: {}, skipped: {} };
  }
}

export function saveState(state: WatchedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function markWatched(id: string) {
  const s = loadState();
  s.watched[id] = Date.now();
  delete s.skipped[id];
  saveState(s);
}

export function markSkipped(id: string) {
  const s = loadState();
  s.skipped[id] = Date.now();
  saveState(s);
}

export function isWatched(id: string): boolean {
  return !!loadState().watched[id];
}

export function isSkipped(id: string): boolean {
  return !!loadState().skipped[id];
}
