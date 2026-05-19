# Role 18 — Desktop Native (Tauri 2)

## Mission
Wrap the Encore web app in a small, fast, native desktop shell using Tauri 2 at `apps/desktop/`, giving macOS, Windows, and Linux users first-class media keys, a menubar / tray presence, a mini-player window, and real install paths (Mac App Store, Microsoft Store, Linux package managers). Tauri keeps the binary small (~5–15 MB vs Electron's ~150 MB) and reuses 100% of the web codebase.

## Surface inventory
- **macOS 12+** (Apple Silicon + Intel universal binary). Menubar, Touch Bar (where present), Now Playing widget integration via `MPNowPlayingInfoCenter`.
- **Windows 10+** (x64 + ARM64). System Media Transport Controls (SMTC), tray icon, jump-list.
- **Linux** (Ubuntu 22.04+, Fedora 39+, Arch). MPRIS2 D-Bus integration, AppImage + .deb + .rpm + Flatpak.
- **Distribution:** Direct DMG / MSI / AppImage downloads, plus signed Mac App Store and Microsoft Store builds, plus a Flatpak on Flathub.

## Implementation approach
Tauri 2 hosts the same Next.js bundle the web app serves, loaded from a packaged static export or pointed at `https://app.encore.audio` for online-first installs. The shell adds a thin Rust layer for OS integration; web code calls it via `@tauri-apps/api`.

- **App skeleton:** `apps/desktop/src-tauri/tauri.conf.json` defines the bundle id (`app.encore.desktop`), icon set, and the allowlist (only the IPC we use — globalShortcut, window, tray, notification). Renderer is the Next.js `apps/web/` build mounted from `apps/desktop/src-tauri/dist`.
- **Native menubar:** `apps/desktop/src-tauri/src/menu.rs` ships platform-correct menus (macOS: standard App / File / Edit / Window / Help; Windows / Linux: thinner File / Playback / View / Help). Menu actions emit Tauri events the web layer subscribes to via `@tauri-apps/api/event`.
- **System media keys:** `tauri-plugin-global-shortcut` registers `MediaPlayPause`, `MediaNextTrack`, `MediaPreviousTrack`, `MediaStop`. macOS also publishes to `MPNowPlayingInfoCenter` (so the Now Playing widget and AirPods double-tap work), Windows uses SMTC, Linux exposes MPRIS2 via `tauri-plugin-mpris` (or a small custom plugin).
- **Mini-player window:** Always-on-top, frameless ~320×120 window via `WebviewWindow.new()` showing the player UI in a compact layout. Toggled from tray, menu, or `Cmd/Ctrl+Shift+M`. Position persisted via `tauri-plugin-store`.
- **Tray icon:** `tauri-plugin-tray` renders a glyph that flips play / pause and shows a context menu (current track, prev / play / next, mini-player toggle, Quit).
- **Auto-update:** `tauri-plugin-updater` against a signed release feed for direct downloads. Store builds get updates from the store and have the updater disabled at compile time.
- **Build matrix:** GitHub Actions runs `tauri build` per OS — macOS (notarized, universal, plus `--target mac-app-store` profile with sandbox entitlements), Windows (Authenticode + MSIX for Store), Linux (AppImage / deb / rpm). Stores require Apple Developer Program ($99/yr) and Microsoft Partner Center ($19 one-time).

## UX & a11y notes
- Window chrome respects platform conventions: traffic lights on macOS, native title bar on Windows, system theme on Linux.
- The mini-player is fully keyboard-navigable and exposes the same shortcuts as the main window (Role 16).
- Tray and menu items have keyboard mnemonics and screen-reader labels.
- Honors `prefers-reduced-motion` for the mini-player slide-in animation.
- High-DPI assets are bundled at @1x / @2x / @3x to keep the tray icon crisp on all platforms.

## Open Questions
- Do we sandbox the Mac App Store build hard enough to also pass Setapp review (potential bonus distribution channel)?
- MPRIS2: bring our own plugin or wait for an official Tauri plugin?
- Auto-update outside of stores — sign with sigstore or stay on Tauri's built-in Ed25519 signing?
- Native lyrics overlay window (always-on-top, click-through) — v1 or v2?
