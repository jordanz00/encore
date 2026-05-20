# Encore accessibility

Accessibility is **release-blocking** for Encore public surfaces. Target **WCAG 2.2 Level AA** minimum; pursue **AAA** for typography and contrast where practical.

When visual design conflicts with accessibility, **accessibility wins**.

## Canonical assets

| Asset | Role |
|-------|------|
| `design/encore-typography.css` | Type scale, contrast tokens, prose measure, `.sr-only` |
| `design/encore-a11y.css` | Skip link, `:focus-visible`, 44px targets, placeholders, reduced motion, forced-colors |
| `apps/web/src/styles/encore-a11y.css` | Web app import of design a11y |
| `apps/web/src/app/globals.css` | Imports typography + a11y; component focus rings |

**Load order (static HTML):** Google Fonts → `encore-typography.css` → `encore-a11y.css` → page styles.

## UI change audit loop

Before marking UI work complete:

1. Semantic HTML (landmarks, headings, lists, buttons vs divs)
2. Heading hierarchy (one logical H1 per view)
3. Keyboard navigation (no traps; logical tab order)
4. Focus states (`:focus-visible`, never bare `outline: none` without replacement)
5. Screen reader labels (`aria-label`, `aria-labelledby`, live regions)
6. Contrast (text, placeholders, disabled, controls)
7. Hit targets (≥ 44×44px where practical — WCAG 2.5.8)
8. Mobile readability and zoom/reflow
9. `prefers-reduced-motion` (pause decorative animation loops)
10. Color not sole indicator of meaning

## Surfaces

| Surface | Status (beta) |
|---------|----------------|
| `apps/web` | Skip link, `#main-content`, semantic nav, a11y CSS, `Player.tsx` keyboard + live region |
| `landing.html` | Product landing: `design/landing.css`, skip link, tabs (keyboard), reduced-motion, waitlist |
| `player/` | Skip link, a11y CSS import, reduced-motion viz, play/pause announcements, tip `aria-label`s |
| Legal / press / transparency / status / investor-deck | Typography + a11y CSS linked |
| `apps/admin`, `apps/mobile` | **Not audited** — schedule before beta |

## Player requirements (ongoing)

- Keyboard: Space/k play-pause, arrows seek/skip (showcase player + web `Player.tsx`)
- Semantic controls and `aria-label` on transport
- Accessible seek (canvas `role="slider"` on showcase; web needs range input when timeline ships)
- Reduced-motion: static waveform frame when `prefers-reduced-motion: reduce`
- Live region for track changes (`aria-live="polite"`)

## Motion policy

- Respect `prefers-reduced-motion`
- No flashing / seizure-risk patterns
- Calm, optional motion; no parallax-heavy marketing without reduced-motion fallback

## Reporting (end of UI cycles)

Include in PRs or ship notes:

- **Improvements made**
- **Remaining risks**
- **Unresolved WCAG items**
- **Areas needing manual test** (screen reader, 200% zoom, mobile VoiceOver/TalkBack)

## Manual verification (recommended)

```bash
# Keyboard: Tab through nav → main → forms → player controls
# Zoom: 200% browser zoom — no horizontal clip on web pages
# Reduced motion: OS setting on — landing/player animations should calm or stop
```

Automated checks (future): axe-core in CI for `apps/web` and static HTML snapshots.

## Philosophy

Encore should feel humane, calm, readable, and inclusive. Artist-first design includes disabled listeners and artists globally. Inclusive UX is part of **long-term trust** — see `docs/SUSTAINABILITY.md`.
