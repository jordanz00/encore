# Role 17 — Mobile Native (iOS + Android)

## Mission
Deliver a true native-feeling mobile app from a single Expo (React Native) codebase at `apps/mobile/` that supports background audio, lock-screen controls, offline downloads, deep links, and the manifest stubs needed for CarPlay and Android Auto certification later. Mobile is where most listening happens; it has to be the most reliable surface Encore ships.

## Surface inventory
- **iOS 16+** (iPhone, iPad). Background audio, lock screen / Control Center, AirPlay 2, CarPlay (entitlement-gated).
- **Android 10+** (phones, tablets, foldables). Foreground service notification, Media3 session, Android Auto (manifest-gated), Wear OS handoff.
- **Future:** visionOS via Mac Catalyst-style fallback; not in scope for v1.

## Implementation approach
The mobile app is Expo SDK 51+ (managed → bare workflow once we add native modules). Audio is owned by `react-native-track-player` (background-capable, queue-aware, MediaSession-aware on Android, `MPRemoteCommandCenter` / `MPNowPlayingInfoCenter` on iOS). `expo-av` is used only for sound-effect-style previews (haptics, UI cues) where the heavyweight track player is overkill.

- **Engine bridge:** A thin wrapper in `packages/player/src/native/track-player.ts` adapts the cross-platform queue / transport contract from **Role 16** to `react-native-track-player`’s capabilities (`PlaybackService`, `Capability.Play`, `Capability.SeekTo`, `Capability.JumpForward`).
- **Offline cache:** Downloads go through `expo-file-system` into an app-private directory; the mapping `trackId → localUri + sha256 + expiresAt` lives in SQLite via `expo-sqlite`. Two tiers:
  1. **Owned downloads** (purchases) — never expire, restorable from receipts.
  2. **Subscribed offline mixes** — TTL refreshed on app open while subscription is active.
- **Lock-screen + notification controls:** `react-native-track-player` registers metadata, artwork, and capabilities; on Android we also declare a `MediaStyle` notification with progress, on iOS we set `nowPlayingInfo` artwork at 1024×1024 to look right on Now Playing.
- **Deep linking:** `encore://track/{id}`, `encore://playlist/{id}`, `encore://artist/{slug}` plus universal / app links from `https://encore.audio/...`. Configured in `apps/mobile/app.json` (`scheme: "encore"`, `associatedDomains` for iOS, `intentFilters` for Android with `autoVerify: true`).
- **CarPlay stub:** `apps/mobile/ios/Encore/Info.plist` declares the audio entitlement (`com.apple.developer.carplay-audio`) and a `CPTemplateApplicationSceneDelegate` placeholder. Apple requires a separate review (MFi-style audio app review) before the entitlement is granted; tracked in **Role 19**.
- **Android Auto stub:** `apps/mobile/android/app/src/main/AndroidManifest.xml` declares `com.google.android.gms.car.application` metadata and an `automotive_app_desc.xml` resource pointing to a media browser service. Real `MediaBrowserServiceCompat` implementation handed off to **Role 19**.
- **Auth + sessions:** Reuses the SDK in `packages/sdk/`; refresh tokens stored in `expo-secure-store` (Keychain / Keystore-backed).

## UX & a11y notes
- All transport controls are real touch targets ≥ 44×44pt and labeled for VoiceOver / TalkBack via `accessibilityLabel`.
- Now-playing screen supports Dynamic Type (iOS) and Android font scaling; artwork has alt text.
- Haptic feedback on track skip is opt-in and respects the system "Reduce Motion" / "Reduce Haptics" toggle.
- Offline state is communicated with a clear, non-modal banner; downloads have an explicit per-item Cancel.
- Background audio respects iOS audio session interruptions (calls, Siri) and ducks for navigation prompts.

## Open Questions
- Do we adopt Expo's new bare-workflow build profile from day one, or stay managed until CarPlay forces the switch? (CarPlay ≈ forces it.)
- Storage budget heuristic for offline mixes — fixed cap, percentage of free space, or user-set?
- Do we ship a separate "Lite" Android build for low-RAM devices, or rely on Hermes + careful list virtualization?
- Receipt validation for owned downloads: server-verify on each launch, or trust the local cache for N days offline?
