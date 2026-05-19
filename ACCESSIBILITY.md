# Accessibility

Encore targets **WCAG 2.2 AA** compliance across every surface (web, mobile, desktop). Accessibility is a launch blocker, not a follow-up.

Detailed brief: [`docs/roles/role-20.md`](docs/roles/role-20.md).

## Commitments

1. **Keyboard-first.** Every interaction reachable without a mouse or touchscreen. Tab order matches visual order. Focus rings are visible and not removed by CSS.
2. **Screen-reader-friendly.** Semantic HTML by default. `aria-live` regions for player state changes. Images have meaningful alt text. Decorative images use `alt=""`.
3. **Color contrast.** ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components. Color is never the only signal of meaning.
4. **Reduced motion.** Respects `prefers-reduced-motion: reduce` (see `apps/web/src/app/globals.css`). No essential information conveyed only via animation.
5. **Captions for visual media.** Music videos ship with WebVTT captions when the artist provides them; we surface a UI for caption upload at the artist side.
6. **Dyslexia-friendly typography option.** Listener setting toggles a more readable font (e.g. OpenDyslexic or Atkinson Hyperlegible).
7. **High-contrast theme.** Dark and light themes plus an opt-in high-contrast variant.
8. **Form labels.** Every form input has an associated `<label>`. Errors are announced to assistive tech.
9. **Player controls** sized ≥ 44×44 CSS pixels for touch targets; AAA-class hit targets where practical.
10. **Language attributes.** `lang` set on `<html>` and on quoted text in a different language.

## Player keyboard map (web)

| Key | Action |
|---|---|
| Space, k | Play / pause |
| j | Seek backward 10 s |
| l | Seek forward 10 s |
| Left / Right arrows | Previous / next track |
| m | Mute / unmute |
| Up / Down arrows | Volume up / down (planned) |
| Home / End | Jump to start / end of track (planned) |

## Mobile

- VoiceOver and TalkBack tested for the player surface.
- Large-text settings respected via React Native dynamic type.
- Background-audio controls accessible from lock screen and Control Center / Quick Settings.

## Desktop

- Full Tauri menu bar with standard accelerators.
- High-contrast themes inherit from the OS.

## Testing

- Manual screen-reader pass with VoiceOver (macOS) and NVDA (Windows) before each release.
- Automated checks via axe-core in CI for the web app.
- Color contrast audit via Lighthouse + manual spot-check.

## Known gaps (v0.0.x)

- The player UI today uses native `<audio controls>` which has limited screen-reader semantics across browsers. Replacing with a custom accessible player is on the v0.1 list (see [`ROADMAP.md`](ROADMAP.md)).
- WCAG 2.2 AA full audit has not been done yet. Slated for v1.0.
- Mobile app has not been tested with VoiceOver / TalkBack yet.

## Reporting accessibility issues

File issues with the `accessibility` label. Severe issues (blockers for assistive-tech users) get priority.

Specifically welcome:

- Reports from screen-reader users
- Reports from users of switch controls / eye-tracking
- Cognitive accessibility feedback
- Color-blind / low-vision users on contrast issues

We aim to acknowledge accessibility issues within 48 hours.
