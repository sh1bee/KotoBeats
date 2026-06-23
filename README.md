# KotoBeat

Japanese language learning powered by music — time-synced lyrics and audio-snippet spaced repetition.

## Tech Stack

- **Expo** (custom dev client required)
- **react-native-track-player** — background audio, lock screen controls, precise seeking
- **expo-file-system** — local audio cache
- **Zustand** — global playback state (Phase 2+)
- **Firebase** — Firestore + Storage (upcoming)

## Phase 1: Audio Core & Local Caching

Phase 1 delivers:

- `track-player-service.ts` — headless playback service for remote controls
- `src/services/audioCache.ts` — downloads remote audio to `file://` document cache
- `src/services/audioPlayer.ts` — resolves cache, then loads local URI into Track Player

### Prerequisites

- Node.js **≥ 20.19.4** (recommended for Expo SDK 56)
- Xcode (iOS) and/or Android Studio (Android)
- **Expo Go will not work** — native modules require a dev build

### Install & Run

```bash
npm install

# Build and run a dev client (pick one)
npx expo run:ios
npx expo run:android

# Or start Metro after a dev build is installed
npm start
```

### How Caching Works

1. `resolveCachedAudioUri(songId, audioUrl)` checks `{document}/audio-cache/{songId}.mp3`
2. If missing, downloads from Firebase Storage (or any HTTPS URL) via `expo-file-system`
3. Track Player receives the local `file://` path for zero-lag playback and seeking

### Phase 1 Test Screen

The default `App.tsx` exposes:

- **Preload to Cache** — download without playing
- **Play Full Song** — cache + play from local file
- **Play Snippet** — seek to lyric `startTime` (loop logic arrives in Phase 3)

Update `src/data/mockSong.ts` with your Firebase Storage `audioUrl` when ready.

## Roadmap

| Phase | Scope |
|-------|--------|
| **1** | Audio core + local caching ✅ |
| **2** | Zustand playback sync + tokenized lyrics UI |
| **3** | Smart loop + Jisho dictionary |
| **4** | Swipe SRS flashcards |

See `README.blueprint.md` for full architecture and Firestore schemas.
