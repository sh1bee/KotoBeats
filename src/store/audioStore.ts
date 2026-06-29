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
  playbackPosition: number;
  isPlaying: boolean;
  loopInterval: LoopInterval | null;
  ignoreStateChange: boolean;
  songLyrics: LyricLine[];
  lastSongId: string | null;


  setCurrentSong: (song: Song) => void;
  setPlaylist: (songs: Song[]) => void;
  setPlaybackPosition: (position: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setLoopInterval: (interval: LoopInterval | null) => void;
  setIgnoreStateChange: (flag: boolean) => void;
  setSongLyrics: (lyrics: LyricLine[]) => void;
  setLastSongId: (id: string | null) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentSong: null,
  playlist: [],
  playbackPosition: 0,
  isPlaying: false,
  loopInterval: null,
  ignoreStateChange: false,
  songLyrics: [],
  lastSongId: null,

  setCurrentSong: (song) => set({ 
    currentSong: song, 
    lastSongId: song?._id || null  // Tự động set lastSongId
  }),
  setPlaylist: (songs) => set({ playlist: songs }),
  setPlaybackPosition: (position) => set({ playbackPosition: position }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setLoopInterval: (interval) => set({ loopInterval: interval }),
  setIgnoreStateChange: (flag) => set({ ignoreStateChange: flag }),
  setSongLyrics: (lyrics) => set({ songLyrics: lyrics }),
  setLastSongId: (id) => set({ lastSongId: id }),
}));