# Role 20 — Accessibility

## Mission
Make Encore usable, on day one, by people who use screen readers, who can't use a mouse, who need high contrast, who get migraines from motion, who read better in dyslexia-friendly fonts, and who rely on captions. Target **WCAG 2.2 AA** across web, desktop, and the WebViews inside mobile / cast surfaces, with platform-native a11y APIs (VoiceOver, TalkBack, Narrator, Orca) on the native shells. Accessibility is a release blocker, not a polish pass.

## Surface inventory
- **Web** (`apps/web/`) — primary a11y reference; runs through axe-core in CI.
- **Desktop** (`apps/desktop/`) — inherits web a11y; adds native menu / tray / mini-player a11y via Tauri's accessible window APIs.
- **Mobile** (`apps/mobile/`) — VoiceOver (iOS) + TalkBack (Android) labels on every interactive node.
- **Car / watch / cast** — covered indirectly: we follow each platform's HIG (CarPlay, Android Auto, watchOS, Wear OS) which are themselves a11y-focused.
- **Captions for music videos** — WebVTT tracks served from the API and rendered consistently on web, mobile, and cast.

## Implementation approach
- **Markup discipline:** Real `<button>`, `<a href>`, `<input>`, `<nav>`, `<main>`, `<aside>`. No clickable `<div>`s. ARIA only where HTML can't carry the semantic (e.g. `role="slider"` on the custom waveform scrubber when `<input type="range">` won't fit). Lives as ESLint rules (`eslint-plugin-jsx-a11y`) plus a custom Stylelint rule blocking `outline: none` without a replacement focus state.
- **Live region for player state:** `apps/web/components/PlayerLive.tsx` renders an `aria-live="polite"` region. Track changes, pause/resume, and end-of-queue announce there. Errors ("Couldn't load track. Retrying.") announce via `aria-live="assertive"` only when the user's action triggered them.
- **Keyboard-first player:** All shortcuts from Role 16 (`Space`/`K`, `J`/`L`, arrows, `M`, `N`, `P`, `S`, `R`, `/`) are documented in a `?` overlay. Tab order follows visual order. Focus rings are visible (3:1 contrast against any background) and never removed.
- **Auto-focus discipline:** We never steal focus on route change; we move focus only on user-initiated actions (open dialog → focus first field; close dialog → return focus to trigger). The now-playing track update is announced via the live region, not by stealing focus.
- **High-contrast theme:** Three modes — Light, Dark, **High Contrast** — driven by `prefers-contrast: more` and a manual override in Settings. All text meets 4.5:1 (normal) / 3:1 (large), all UI controls meet 3:1 against adjacent colors. Tokenized in `packages/ui/`.
- **Dyslexia-friendly font option:** A toggle in Settings swaps the body font for OpenDyslexic (or Atkinson Hyperlegible — final pick TBD; both ship with permissive licenses). Font swap is opt-in, persists per-account, and is respected on web + desktop.
- **Reduced motion:** All non-essential animation (waveform shimmer, album-art crossfade, mini-player slide, tab transitions) is disabled when `prefers-reduced-motion: reduce`. Crossfade between *tracks* (audio) is preserved — that's content, not chrome.
- **Captions for music videos:** Video player loads `WebVTT` from `/captions/{videoId}/{lang}.vtt`. UI exposes language picker and a "captions on by default" preference. Captions render with a configurable background opacity for contrast.
- **Screen reader testing:** VoiceOver on macOS / iOS, TalkBack on Android, NVDA on Windows. Each release goes through a scripted smoke test in `docs/qa/a11y-smoke.md` (TBD).
- **Automated checks:** `axe-core` in Playwright tests (`apps/web/tests/a11y.spec.ts`, TBD), Lighthouse a11y score ≥ 95 in CI, `eslint-plugin-jsx-a11y` in lint.

## UX & a11y notes
- Touch targets ≥ 44×44 CSS pixels on web/desktop, ≥ 44pt on iOS, ≥ 48dp on Android.
- Color is never the only signal — pair with icon + text for play/pause, like/unlike, online/offline.
- Drag-and-drop (queue reorder) has a keyboard alternative ("move up / move down" buttons + a screen-reader-only instruction).
- Form errors are programmatically associated with inputs via `aria-describedby` and announced inline.

## Open Questions
- OpenDyslexic vs Atkinson Hyperlegible — pick one or ship both?
- Do we localize captions ourselves, or accept community-contributed captions (and how do we moderate them)?
- Sign-language overlay video tracks for music videos — v2 nice-to-have?
- A11y certification — pursue formal third-party audit (e.g. Deque, Level Access) before v1, or after first 1k users?
