/**
 * @encore/player — cross-platform player core.
 *
 * Defines a platform-agnostic queue + state machine that web (HTMLAudio +
 * HLS.js), mobile (react-native-track-player), and desktop (Tauri wrapping
 * web) can each plug into. Implementation per RFC 007.
 */
export interface QueueItem {
  trackId: string;
  title: string;
  artist: string;
  durationMs: number;
  hlsUrl?: string;
  flacUrl?: string;
  artworkUrl?: string;
}

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export interface PlayerState {
  queue: QueueItem[];
  index: number;
  status: PlayerStatus;
  positionMs: number;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  crossfadeMs: number;
  volume: number;
}

export const DEFAULT_STATE: PlayerState = {
  queue: [],
  index: 0,
  status: "idle",
  positionMs: 0,
  shuffle: false,
  repeat: "off",
  crossfadeMs: 0,
  volume: 1,
};

export type PlayerEvent =
  | { type: "play" }
  | { type: "pause" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "seek"; positionMs: number }
  | { type: "setQueue"; items: QueueItem[]; startIndex?: number }
  | { type: "addToQueue"; item: QueueItem }
  | { type: "setShuffle"; on: boolean }
  | { type: "setRepeat"; mode: PlayerState["repeat"] }
  | { type: "setVolume"; volume: number };

export function reduce(state: PlayerState, event: PlayerEvent): PlayerState {
  switch (event.type) {
    case "play":
      return { ...state, status: "playing" };
    case "pause":
      return { ...state, status: "paused" };
    case "next":
      return { ...state, index: Math.min(state.queue.length - 1, state.index + 1), positionMs: 0 };
    case "previous":
      return { ...state, index: Math.max(0, state.index - 1), positionMs: 0 };
    case "seek":
      return { ...state, positionMs: event.positionMs };
    case "setQueue":
      return { ...state, queue: event.items, index: event.startIndex ?? 0, positionMs: 0 };
    case "addToQueue":
      return { ...state, queue: [...state.queue, event.item] };
    case "setShuffle":
      return { ...state, shuffle: event.on };
    case "setRepeat":
      return { ...state, repeat: event.mode };
    case "setVolume":
      return { ...state, volume: Math.max(0, Math.min(1, event.volume)) };
    default:
      return state;
  }
}
