# KotoBeat

Japanese language learning powered by music — time-synced lyrics and audio-snippet spaced repetition.

## Tech Stack

- **Expo SDK 56** (Android dev client required)
- **react-native-track-player** — background audio, lock screen controls, precise seeking
- **expo-file-system** — local audio cache
- **Zustand** — global playback state
- **Firebase** — Firestore + Storage + Auth

## Setup

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo file .env từ .env.example
cp .env.example .env

# 3. Build và chạy Android
npm run android
# hoặc: npx expo run:android
```

## Firebase Setup

1. Tạo dự án Firebase tại https://console.firebase.google.com
2. Thêm app Android với package name: `com.kotobeat.app`
3. Tải file serviceAccountKey.json và đặt vào root project
4. Bật Firestore và Storage
5. Cập nhật .env với Firebase config

## Upload Songs Script

```bash
node uploadSongs.js
```

Script tự động chuyển Google Drive links thành streaming links và upload lên Firestore.

## Audio Caching

Hệ thống tự động cache audio xuống thiết bị để:
- Playback không lag
- Seek nhanh
- Hỗ trợ offline

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| **1** | ✅ | UI + Mock logic |
| **2** | ✅ | Firebase config + TrackPlayer native |
| **3** | ✅ | Audio caching + Loop playback |
| **4** | ✅ | Flashcards + Sync SRS data |
| **5** | ✅ | Auth + Profile stats |

## Android Build (EAS)

```bash
# Cài đặt EAS CLI
npm install -g eas-cli

# Build development
eas build --platform android --profile development

# Build production
eas build --platform android --profile production
```