// src/store/audioStore.ts
import { create } from 'zustand';
import type { Song, LyricLine } from '../types';

interface LoopInterval {
  start: number;
  end: number;
}

interface AudioState {
  currentSong: Song | null;
  playlist: Song[];
  currentAlbumSongs: Song[] | null;
  songLyrics: LyricLine[];      // 👈 Thêm
  lastSongId: string | null;    // 👈 Thêm
  playbackPosition: number;
  isPlaying: boolean;
  loopInterval: LoopInterval | null;
  ignoreStateChange: boolean;

  setCurrentSong: (song: Song) => void;
  setPlaylist: (songs: Song[]) => void;
  setCurrentAlbumSongs: (songs: Song[] | null) => void;
  setSongLyrics: (lyrics: LyricLine[]) => void;   // 👈 Thêm
  setLastSongId: (id: string | null) => void;     // 👈 Thêm
  setPlaybackPosition: (position: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setLoopInterval: (interval: LoopInterval | null) => void;
  setIgnoreStateChange: (flag: boolean) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentSong: null,
  playlist: [],
  currentAlbumSongs: null,
  songLyrics: [],          // 👈 khởi tạo mảng rỗng
  lastSongId: null,
  playbackPosition: 0,
  isPlaying: false,
  loopInterval: null,
  ignoreStateChange: false,

  setCurrentSong: (song) => set({ currentSong: song }),
  setPlaylist: (songs) => set({ playlist: songs }),
  setCurrentAlbumSongs: (songs) => set({ currentAlbumSongs: songs }),
  setSongLyrics: (lyrics) => set({ songLyrics: lyrics }),  // 👈 Thêm
  setLastSongId: (id) => set({ lastSongId: id }),          // 👈 Thêm
  setPlaybackPosition: (position) => set({ playbackPosition: position }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setLoopInterval: (interval) => set({ loopInterval: interval }),
  setIgnoreStateChange: (flag) => set({ ignoreStateChange: flag }),
}));