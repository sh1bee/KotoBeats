// src/hooks/useMusicData.ts
import { useMemo } from 'react';
import { useAudioStore } from '../store/audioStore';
import { pickRandomSongs, groupSongsIntoAlbums, Album } from '../utils/musicDataUtils';
import type { Song } from '../types';

interface MusicData {
  quickPicks: Song[];
  quickPlay: Song[];
  albums: Album[];
}

export function useMusicData(): MusicData {
  const playlist = useAudioStore((state) => state.playlist);

  return useMemo(() => {
    if (!playlist || playlist.length === 0) {
      return { quickPicks: [], quickPlay: [], albums: [] };
    }

    // 1. Chọn ngẫu nhiên 15 bài cho Quick Picks
    const quickPicks = pickRandomSongs(playlist, Math.min(21, playlist.length));
    const quickPickIds = new Set(quickPicks.map(s => s._id));

    // 2. Chọn ngẫu nhiên 10 bài cho Quick Play, không trùng với Quick Picks
    const quickPlay = pickRandomSongs(playlist, Math.min(10, playlist.length), quickPickIds);

    // 3. Gom nhóm album
    const albums = groupSongsIntoAlbums(playlist);

    return { quickPicks, quickPlay, albums };
  }, [playlist]);
}