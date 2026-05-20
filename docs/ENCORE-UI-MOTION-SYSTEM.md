# Encore UI + motion system (production spec)

**Package:** `@encore/ui-system` (`packages/ui-system/`)

Not a theme idea. Shippable tokens, motion, and state-aware components tied to real data.

## Architecture

```
packages/ui-system/
  src/tokens/     colors, spacing, typography, motion
  src/motion/     easing, transitions, spring, presence
  src/components/ button, card, layout, typography, player, task-state
  src/hooks/      usePrefersReducedMotion, useSmoothProgress
  styles/         ui-system.css (CSS variables + classes)
```

## Cuban + Ive filters

| Filter | Rule |
|--------|------|
| **Cuban** | No UI that does not improve clarity, conversion, or reduce complexity |
| **Ive** | Clarity, content-first, remove noise, physical motion |

## Typography

- Stack: SF Pro (system) → Inter → system-ui
- Display: Newsreader (Encore brand)
- Max 2 families
- Scale: H1 48–56px … Caption 13–14px (see `tokens/typography.ts`)

## Color (dark default for player/chrome)

- Background `#0B0C10`
- Text primary/secondary/tertiary via rgba
- Single accent: blue system + Encore red for brand actions
- No gradient chaos

## Spacing

8pt grid only: `4, 8, 16, 24, 32, 48, 64`

## Motion

| Token | Value |
|-------|--------|
| `--ease-out-apple` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--ease-smooth` | cubic-bezier(0.4, 0, 0.2, 1) |
| Micro | 150–180ms |
| UI | 220–320ms |
| Page | 400–700ms |

`prefers-reduced-motion` disables animation durations and transforms.

## Real-time task visualization

`TaskStateIndicator` states (mapped from execution JSON):

| State | Visual |
|-------|--------|
| queued | pulsing dot |
| running | glow pulse |
| validating | shimmer |
| complete | stable green |
| failed | muted red + log link |

No fake spinners — fetch state on `/system` is real network pending.

## Player

- `useSmoothProgress` + `SmoothProgressBar` — rAF interpolation on real `currentTime/duration`
- `PlayerChrome` — optional presentational shell

## Usage (web)

```tsx
import { UIButton, UICard, TaskStateIndicator, SmoothProgressBar } from "@encore/ui-system";
```

```css
/* globals.css */
@import "../styles/ui-system.css";
```

## Execution integration

- `pnpm swarm:cycle` → `execution-status.json` + artifacts
- `/system` page uses `TaskStateIndicator` per task

## Related

- [ENCORE-APPLE-PRODUCTION-SYSTEM.md](./ENCORE-APPLE-PRODUCTION-SYSTEM.md)
- [ENCORE-OBSERVABLE-EXECUTION.md](./ENCORE-OBSERVABLE-EXECUTION.md)
