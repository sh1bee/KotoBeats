import { useEffect, useRef } from 'react';
import TrackPlayer, { Event } from '@rntp/player';
import { useAudioStore } from '../store/audioStore';

export const useTrackChangeListener = () => {
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const prevIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const index = await TrackPlayer.getActiveMediaItemIndex();
        if (index !== null && index !== undefined && index !== prevIndexRef.current) {
          prevIndexRef.current = index;
          const state = useAudioStore.getState();
          const albumSongs = state.currentAlbumSongs;
          const playlist = state.playlist;
          // Ưu tiên album, nếu không có thì dùng playlist, nếu playlist cũng không có thì dùng mảng rỗng
          const source = (Array.isArray(albumSongs) && albumSongs.length > 0)
            ? albumSongs
            : (Array.isArray(playlist) ? playlist : []);
          if (index >= 0 && index < source.length && source[index]) {
            setCurrentSong(source[index]);
          }
        }
      } catch (e) {}
    }, 1000);

    const sub = TrackPlayer.addEventListener(
      Event.PlaybackStateChanged,
      (data: any) => {
        const state = data?.state ?? data;
        const ignore = useAudioStore.getState().ignoreStateChange;
        if (ignore && (state === 'buffering' || state === 'ready')) return;
        const playing = state === 'playing' || state === 'buffering' || state === 'ready';
        setIsPlaying(playing);
      }
    );

    return () => {
      clearInterval(intervalId);
      sub.remove();
    };
  }, [setCurrentSong, setIsPlaying]);
};