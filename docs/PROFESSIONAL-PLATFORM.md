# Professional platform checklist

Industry-direction requirements. **Status:** living — not a claim of completion.

Legend: ✅ wired · 🟡 partial · ⬜ open

## Playback

| Feature | Status | Notes |
|---------|--------|-------|
| HLS adaptive stream | 🟡 | Worker ladder + web `hls.js` |
| FLAC / fallback | 🟡 | `flacKey` + presign redirect |
| Queue / track pick | ✅ | `ReleaseExperience` + controlled `Player` |
| Gapless | ⬜ | |
| Playlist persistence | ⬜ | API exists; web UI thin |
| Background play | 🟡 | Mobile expo-av; web tab |
| Preload next track | 🟡 | `link rel=preload` in `Player.tsx` |
| Media session | ✅ | `Player.tsx` |
| Keyboard controls | ✅ | Web player |
| Waveform | 🟡 | Worker JSON; showcase player only |

## Audio quality

| Feature | Status | Notes |
|---------|--------|-------|
| Transcode pipeline | ✅ | `apps/worker/src/jobs/transcode.ts` |
| LUFS / ReplayGain | ✅ | ebur128 in worker |
| Waveform peaks | ✅ | Uploaded to S3 |
| Integrity validation | 🟡 | ffprobe; more gates TBD |

## Artist tools

| Feature | Status | Notes |
|---------|--------|-------|
| Upload E2E | ✅ | `/upload` release→track→publish |
| Release management | 🟡 | Publish API; no schedule UI |
| Wallet read | ✅ | `GET /wallet/artist/:id` + `/dashboard` |
| Metadata edit | ⬜ | |
| Analytics | ⬜ | |
| Federation Follow stored | ✅ | `remote_followers` table |
| Federation Follow Accept | ✅ | Signed Accept to follower inbox |
| Listener library (follows) | ✅ | `GET /follows/me`, `/library` |

## Discovery

| Feature | Status | Notes |
|---------|--------|-------|
| Discover feed | ✅ | `/recommendations/discover` |
| Search | 🟡 | Web search page |
| Ethical ranking | ✅ | Policy: no payola in charter |
| Federated discovery | 🟡 | ActivityPub publish |

## Mobile

| Feature | Status | Notes |
|---------|--------|-------|
| Discover list | ✅ | |
| Release + playback | 🟡 | `apps/mobile/src/app/release/[id].tsx` (expo-av; HLS device-dependent) |
| Offline downloads | ⬜ | |
| Lock screen controls | ⬜ | |

## Interop

| Standard | Status |
|----------|--------|
| ActivityPub | 🟡 |
| Subsonic | 🟡 MVP |
| RSS / podcast | 🟡 |
| DDEX | 🟡 stub ingest |
| WCAG 2.2 AA | 🟡 |

Update this table when shipping meaningful slices.
