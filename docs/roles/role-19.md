# Role 19 — Car, Watch & Cast

## Mission
Take Encore out of the phone and put it on the surfaces people actually use during the rest of the day: the car dashboard, the wrist, the speaker in the kitchen, and the TV. Each of these targets has its own certification, entitlement, and review path; this role owns the pipeline from "we shipped the manifest stub in Role 17" to "the user can ask their car to play Encore."

## Surface inventory
- **Apple CarPlay (audio app)** — iOS 16+; entitlement-gated, separate Apple review.
- **Android Auto (media app)** — Android 10+; Play Console review against the "Cars" media app policy.
- **watchOS 10+** — Now-Playing complication, basic transport controls, optional offline sync.
- **Wear OS 4+** — Media3 session, complication, optional offline sync.
- **Sonos S2** — "Add Music Service" via the Sonos Music API (SMAPI) and certification program.
- **Chromecast** — Google Cast Receiver app (CAF v3) for Chromecast, Chromecast with Google TV, Cast-enabled speakers / TVs.
- **AirPlay 2** — Effectively free on iOS via `MPNowPlayingInfoCenter` and on macOS via Tauri (Role 18); included here for tracking.

## Implementation approach
- **CarPlay (iOS):** The entitlement (`com.apple.developer.carplay-audio`) is requested by emailing Apple's CarPlay team after the app meets the audio category requirements; this is a separate review on top of the standard App Store review. The implementation is a `CPTemplateApplicationSceneDelegate` in `apps/mobile/ios/Encore/CarPlay/` that builds `CPListTemplate`s from the SDK (recently played, library, search) and binds transport to the same `react-native-track-player` instance the phone UI drives. **Cost / time:** Apple Developer Program $99/yr + 4–8 weeks of CarPlay-specific review.
- **Android Auto:** A `MediaBrowserServiceCompat` subclass in `apps/mobile/android/app/src/main/java/app/encore/auto/` exposes the same browse tree. Declared in `AndroidManifest.xml` via the `automotive_app_desc.xml` stub from Role 17. Reviewed by Google against the [Cars app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality) policy.
- **watchOS:** A standalone WatchKit target in `apps/mobile/ios/Encore-Watch/` shows current track via `WCSession` mirrored from the phone, plus a `WidgetKit` complication that calls `MPNowPlayingInfoCenter` for the live state. Independent watch playback (via the watch's own cellular / Wi-Fi) is a v2 stretch.
- **Wear OS:** A separate Android module at `apps/mobile/android/wear/` using AndroidX Media3 (`MediaSessionService`) and Tiles for the now-playing complication. Shares the offline cache schema with the phone via a small Wear Data Layer sync.
- **Sonos S2:** SMAPI is a SOAP/XML service we host (likely co-located with `apps/api/`) implementing `getMetadata`, `getMediaURI`, `search`, and the OAuth flow. Sonos certification takes ~6–12 weeks and requires a real customer-support channel.
- **Chromecast:** A Cast Receiver web app deployed to a stable URL (e.g. `https://cast.encore.audio/`), registered in the Google Cast SDK Developer Console (one-time $5 fee). Uses the CAF Receiver SDK to handle queue, ads-free transitions, and DRM where present. The Sender SDK is integrated in **Role 16** (web) and **Role 17** (mobile).
- **AirPlay 2:** Inherited automatically on iOS / macOS once `MPNowPlayingInfoCenter` and an active `AVAudioSession` are set; no separate work beyond surfacing the AirPlay route picker (`AVRoutePickerView` on iOS).

## UX & a11y notes
- **Car surfaces** must obey the platform's distraction-free rules: no free-text search while driving, large hit targets, voice-first browsing, text truncation rules per CarPlay / AA HIG. We build our browse tree to lean on recently-played, downloaded, and curated mixes — short, scannable lists.
- **Watch surfaces:** glanceable. One screen = one decision. Haptic confirmation on skip.
- **Cast / Sonos:** rendering happens on the speaker, but the controlling client is responsible for accessibility (labels, captions for music videos when cast to a TV — see Role 20).
- All car / watch UIs follow Role 20's contrast and reduced-motion rules; complications use system fonts.

## Open Questions
- Sonos certification is the slowest path (~3 months) — do we start it in parallel with v1, or after launch?
- Do we ship a Cast Receiver UI with album art and lyrics, or a minimal "now playing" screen for v1?
- Wear OS independent playback (LTE watches) — v1 or v2?
- CarPlay search-by-voice: integrate with SiriKit `INPlayMediaIntent` from day one, or after CarPlay review passes?
