import { create } from 'zustand';

import type { Song } from '../types';

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

  setCurrentSong: (song: Song) => void;
  setPlaylist: (songs: Song[]) => void;
  setPlaybackPosition: (position: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setLoopInterval: (interval: LoopInterval | null) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentSong: null,
  playlist: [],
  playbackPosition: 0,
  isPlaying: false,
  loopInterval: null,

  setCurrentSong: (song) => set({ currentSong: song }),
  setPlaylist: (songs) => set({ playlist: songs }),
  setPlaybackPosition: (position) => set({ playbackPosition: position }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setLoopInterval: (interval) => set({ loopInterval: interval }),
}));
