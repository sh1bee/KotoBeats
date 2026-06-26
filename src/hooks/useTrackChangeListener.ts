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
        if (index !== null && index !== undefined && index !== prevIndexRef.current) {
          prevIndexRef.current = index;
          if (index >= 0 && index < playlist.length && playlist[index]) {
            setCurrentSong(playlist[index]);
          }
        }
      } catch (e) {}
    }, 1000);

    const sub = TrackPlayer.addEventListener(
        Event.PlaybackStateChanged,
        (data: any) => {
        const state = data?.state ?? data;
        const ignore = useAudioStore.getState().ignoreStateChange;
        // Nếu đang tạm bỏ qua và sự kiện là buffering/ready thì không làm gì
        if (ignore && (state === 'buffering' || state === 'ready')) {
            return;
        }
        // Cập nhật isPlaying như cũ
        if (state === 'playing' || state === 'buffering' || state === 'ready') {
            setIsPlaying(true);
        } else if (state === 'paused' || state === 'idle' || state === 'none' || state === 'stopped') {
            setIsPlaying(false);
        }
        }
    );

    return () => {
      clearInterval(intervalId);
      sub.remove();
    };
  }, [playlist, setCurrentSong, setIsPlaying]);
};