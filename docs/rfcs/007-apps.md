# RFC 007 — Apps Strategy

## Status

Proposed.

## Context

To compete with Spotify and Apple Music, Encore needs first-class apps on every surface listeners actually use: web, iOS, Android, macOS, Windows, Linux, CarPlay, Android Auto, Apple Watch, Wear OS, Sonos, Chromecast, AirPlay 2. We cannot maintain six independent native codebases as a small OSS team. We share aggressively, native-extend where the platform demands it.

## Decision

### Code-sharing strategy

- `packages/player/` — cross-platform player core (queue + state machine + reducer). Pure TS, no DOM dependency. Web, mobile, and desktop all consume this module.
- `packages/sdk/` — public TS SDK for the Encore HTTP API. MIT-licensed (separate from the AGPL-3.0 server) so third-party clients can adopt it without copyleft concerns.
- `packages/ui/` — shared design tokens. Web uses Tailwind; mobile uses RN StyleSheet; both reference the same token values.

### Web (`apps/web`)

- Next.js 15 (App Router), React 19, Tailwind, Wavesurfer.js + HLS.js fallback.
- Player: gapless playback via dual `<audio>` element crossover; crossfade opt-in; queue; lyrics overlay (when track has lyrics); MediaSession API for OS-level controls.
- AirPlay + Cast: surfaced via `RemotePlayback` API where available; explicit fallback to native dialogs.
- Keyboard: space/k play+pause; j/l seek 10s; arrows previous/next; m mute.
- Accessibility: WCAG 2.2 AA target; aria-live player state; high-contrast theme; reduced-motion support.

### Mobile native (`apps/mobile`)

- Expo (React Native 0.76) + react-native-track-player (background audio + lock-screen controls + notifications).
- Offline cache for downloaded purchases and HiFi tier offline mixes (expo-file-system + secure-store).
- Deep linking via `encore://` and universal links.
- iOS: bundle id `fm.encore.audio`; CarPlay audio entitlement declared (`com.apple.developer.carplay-audio`); requires Apple MFi-style review for CarPlay app inclusion.
- Android: same bundle id; FOREGROUND_SERVICE_MEDIA_PLAYBACK permission; Android Auto manifest.
- App Store submission requires Apple Developer Program ($99/yr); Google Play requires one-time $25.

### Desktop native (`apps/desktop`)

- Tauri 2 wrapping the web app at `http://localhost:3000` (dev) or the bundled web build (prod).
- Native menu via Tauri menu API; system media keys via `tauri-plugin-global-shortcut` (planned).
- Mini-player: secondary borderless window pinned on top, ~300x80px (planned).
- Tray icon with current-track display (planned).
- Bundle targets: dmg, nsis, deb, AppImage. Mac App Store + Microsoft Store paths require respective developer accounts.

### Car + watch + cast

- **CarPlay:** entitlement declared in `apps/mobile/app.json`. CarPlay audio app inclusion requires Apple review. Stub today; full template in roadmap.
- **Android Auto:** manifest entries in `apps/mobile/app.json`. Fully implementable without external review.
- **Apple Watch:** now-playing complication via NowPlayingInfoCenter + WCSession. Phase 2.
- **Wear OS:** Media3 module on the Android side. Phase 2.
- **Sonos:** S2 add-services certification path. Phase 3 — operationally heavy, unlock at scale.
- **Chromecast:** custom receiver app (HTML5). Phase 2.
- **AirPlay 2:** automatic via iOS / macOS MediaSession; no custom work needed.

### Editorial CMS (`apps/admin`)

- Separate Next.js app on port 3002 (different process, different security boundary).
- Editor sign-in restricted by `users.role IN ('editor', 'moderator', 'admin')`.
- Slot management for /discover and /editorial; playlist builder; podcast queue; DMCA queue; moderation queue.

### Distribution / signing

- Web auto-deploys via reverse proxy to api.
- Mobile via Expo EAS Build → TestFlight + Google Play internal track.
- Desktop signed installers from CI (Apple Developer cert + Windows code-signing cert; both require accounts).

## Alternatives Considered

| Choice | Considered | Why not |
|---|---|---|
| One codebase via PWA only | Cheap | iOS PWA limitations (no background audio reliably, no CarPlay); failed by design |
| Native Swift + Kotlin per platform | Best UX | 3x maintenance for a small team |
| Flutter | Excellent UI | Different language; loses TS code-share with web/server |
| Electron desktop | Familiar | 5–10x bundle size; higher memory per window |

## Consequences

- One web codebase + one mobile codebase + one desktop wrapper covers > 95% of listening surfaces with realistic team size.
- Native review processes (Apple, Google, Microsoft) gate release cadence on those platforms; we plan accordingly.
- CarPlay specifically requires Apple's audio-app entitlement review; we have no leverage to accelerate this.

## Open Questions

- Mini-player on desktop: separate Tauri window or web-only floating panel?
- Should `packages/player/` ship as an npm package independent of Encore so other OSS music apps can adopt?
- watchOS app vs complication-only for Phase 2?
- Tauri mobile (when stable) replaces Expo entirely?
