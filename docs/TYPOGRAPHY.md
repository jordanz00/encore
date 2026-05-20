# Encore typography system

## Canonical source

**`design/encore-typography.css`** — single source for tokens, base styles, and utilities.

**Accessibility:** load **`design/encore-a11y.css`** after typography on static pages; see **`docs/ACCESSIBILITY.md`**.

| Consumer | How it loads |
|----------|----------------|
| Static HTML (landing, legal, press, transparency, investor-deck) | `<link rel="stylesheet" href="design/encore-typography.css">` |
| Web app (`apps/web`) | `@import` via `src/styles/encore-typography.css` + Tailwind + `next/font` |
| Player | `@import` in `player/player.css` + `player/type-system.css` |
| `@encore/ui` | `tokens.font` / `tokens.fontSize` in `packages/ui/src/index.ts` (keep in sync) |

## Fonts

- **Newsreader** — display headings, hero, editorial leads
- **Inter** — UI, body, forms, navigation
- **JetBrains Mono** — eyebrows, stats, tabular numbers (landing + web)

## Scale (minimum 12px UI)

| Token | Size | Use |
|-------|------|-----|
| `--text-2xs` | 12px | Labels, eyebrows (floor) |
| `--text-xs` | 13px | Meta, captions |
| `--text-sm` | 15px | Secondary UI |
| `--text-base` | 17px | Body |
| `--text-lg`+ | fluid | Headings |

## Web components

Tailwind + CSS layers in `apps/web/src/app/globals.css`:

- `.encore-container` — readable width + padding
- `.encore-page` / `.encore-page-title` / `.encore-page-lead`
- `.encore-card`, `.encore-input`, `.encore-btn-*`
- `.encore-prose` — long-form copy

## Accessibility

- Muted text `#3d3934` on `#faf6ec` (AA+)
- Dark mode muted `#c0c0ca` / `#a8a8b4` on `#0b0b0e`
- `prefers-contrast: more` bumps secondary text
- Focus rings on interactive elements
- Body 17px, line-height 1.5–1.62

## When editing

1. Change **`design/encore-typography.css` first**
2. Mirror token changes in `tailwind.config.ts` and `packages/ui` if needed
3. Avoid new arbitrary `text-[10px]` or `text-gray-400` in components
