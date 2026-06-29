import { useEffect, useRef } from 'react';
import TrackPlayer, { Event } from '@rntp/player';
import { useAudioStore } from '../store/audioStore';

export const useTrackChangeListener = () => {
  const playlist = useAudioStore((state) => state.playlist);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const prevIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const index = await TrackPlayer.getActiveMediaItemIndex();
        //console.log('🔍 Polling active index:', index, 'prevIndex:', prevIndexRef.current);
        if (index !== null && index !== undefined && index !== prevIndexRef.current) {
          prevIndexRef.current = index;
          if (index >= 0 && index < playlist.length && playlist[index]) {
            console.log('🎵 Setting current song to:', playlist[index].title);
            setCurrentSong(playlist[index]);
          } else {
            console.warn('⚠️ Playlist length:', playlist.length, 'index:', index);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 1000);

    const subPlaybackState = TrackPlayer.addEventListener(
      Event.PlaybackStateChanged,
      (data: any) => {
        const state = data?.state ?? data;
        const ignore = useAudioStore.getState().ignoreStateChange;
        if (ignore && (state === 'buffering' || state === 'ready')) return;

        if (state === 'playing' || state === 'buffering' || state === 'ready') {
          setIsPlaying(true);
        } else if (state === 'paused' || state === 'idle' || state === 'none' || state === 'stopped') {
          setIsPlaying(false);
        }

        // Tự động chuyển bài
        if (state === 'stopped' || state === 'idle') {
          console.log('🔄 Track ended, skipping to next');
          TrackPlayer.skipToNext().catch(err => console.error('Skip failed:', err));
        }
      }
    );

    return () => {
      clearInterval(intervalId);
      subPlaybackState.remove();
    };
  }, [playlist, setCurrentSong, setIsPlaying]);
};