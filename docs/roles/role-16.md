# Role 16 — Web Player

## Mission
Ship a fast, accessible, gapless web player inside the Next.js 15 app at `apps/web/` that matches the table-stakes feel of Spotify Web and Apple Music for Web. The web player is the reference surface: every other client (mobile, desktop, cast) inherits its queue model, transport semantics, and event contract from `packages/player/`.

## Surface inventory
- **Browsers:** Evergreen Chrome, Edge, Firefox, Safari 17+ on desktop; Mobile Safari and Chrome Android as a fallback when the native app is not installed.
- **PWA install:** Optional installable PWA for ChromeOS, Linux desktops, and users who decline native installs.
- **OS hooks:** `MediaSession` for OS-level transport (lock screen, headset buttons, smart speakers), AirPlay via `<audio remote="true">` and Google Cast Sender SDK for handoff to Chromecast / Cast-enabled speakers.
- **Streams:** Direct progressive (`audio/mpeg`, `audio/aac`, `audio/flac`) for short tracks; HLS for long-form (mixes, podcasts, live).

## Implementation approach
The audio core lives in `packages/player/` (currently a placeholder directory) and is consumed by `apps/web/`, which already declares `wavesurfer.js ^7.8.6` and `hls.js ^1.5.17` in `apps/web/package.json`. Concretely:

- **Engine:** Two pooled `HTMLAudioElement` instances managed by `packages/player/src/engine/dual-audio.ts`. The "next" element preloads ~5s before the current track ends; on `ended`, ownership swaps. This gives us **gapless playback** and free **crossfade** (linear ramp on `.volume` over 1–12s, configurable per playlist).
- **HLS:** When `canPlayType('application/vnd.apple.mpegurl')` is false (Chrome / Firefox), we attach `hls.js` to the active element. Safari uses native HLS.
- **Waveforms:** `wavesurfer.js` renders the scrubber for the now-playing screen and editor-style scrubbing in the lyrics view; we feed it pre-computed peaks from the API to avoid decoding the whole track in the browser.
- **Queue:** A Zustand store in `packages/player/src/queue/` exposes `play(trackId)`, `enqueueNext()`, `enqueueLast()`, `shuffle()`, and a `repeat: 'off'|'one'|'all'` mode. State is mirrored to `sessionStorage` so reloads survive.
- **Lyrics overlay:** Time-synced LRC pulled from the API and rendered as a WebVTT-style track aligned to `currentTime` via `requestAnimationFrame`.
- **OS controls:** `navigator.mediaSession.metadata` + `setActionHandler` for `play`, `pause`, `previoustrack`, `nexttrack`, `seekto`. Updated on every track change.
- **Cast / AirPlay:** Cast Sender SDK loaded lazily on user gesture only (privacy + bundle size). AirPlay button is the standard `<audio>` remote-playback prompt on Safari; we never autocast.
- **Keyboard shortcuts** (registered on `document`, suppressed when focus is in an input): `Space` / `K` toggle, `J` back 10s, `L` forward 10s, `←`/`→` scrub 5s, `↑`/`↓` volume 5%, `M` mute, `N` next, `P` previous, `S` shuffle, `R` repeat, `/` focus search.

## UX & a11y notes
- Player chrome uses semantic `<button>` with `aria-label` and `aria-pressed`; the scrubber is `<input type="range">` with `aria-valuetext` set to `"M:SS of M:SS"`.
- Track changes announce via an `aria-live="polite"` region in `apps/web/components/PlayerLive.tsx` ("Now playing: Title — Artist").
- Shortcuts are listed in a `?` overlay and discoverable via the help menu.
- Honors `prefers-reduced-motion` (no waveform shimmer) and `prefers-color-scheme`. See **Role 20** for the full a11y bar.

## Open Questions
- Do we ship Web Audio Graph EQ now, or wait for the native clients to set the contract?
- How aggressively should we prefetch the next track on metered connections — gate on `navigator.connection.saveData`?
- Cast Receiver app: bundled with this role or owned by **Role 19**? (Lean: Role 19.)
- Should crossfade obey per-track loudness normalization (ReplayGain / EBU R128) before or after the ramp?
