// src/hooks/useAudioSync.ts
import { useEffect, useRef } from 'react';
import TrackPlayer, { useProgress, Event, PlaybackState } from '@rntp/player';
import { useAudioStore } from '../store/audioStore';

export const useAudioSync = () => {
  const { position } = useProgress(0.25);
  const setPlaybackPosition = useAudioStore((state) => state.setPlaybackPosition);
  const loopInterval = useAudioStore((state) => state.loopInterval);
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setPlaybackPosition(position);

    if (loopInterval && position >= loopInterval.end) {
      void TrackPlayer.seekTo(loopInterval.start);
    }
  }, [position, loopInterval, setPlaybackPosition]);

  // Tìm đến useEffect chứa addEventListener và sửa lại điều kiện so sánh chuỗi:
  useEffect(() => {
    if (!listenerRef.current) {
      const subscription = TrackPlayer.addEventListener(
        Event.PlaybackStateChanged,
        (state: any) => {
          // Lấy chuỗi trạng thái bằng cách ép kiểu an toàn
          const currentStateStr = typeof state === 'string' ? state : String(state?.state || '');
          
          // So sánh trực tiếp với chuỗi viết thường hoặc viết hoa tùy thư viện ('ended')
          if (currentStateStr.toLowerCase() === 'ended' && loopInterval) {
            void TrackPlayer.seekTo(loopInterval.start);
            void TrackPlayer.play();
          }
        }
      );
      listenerRef.current = () => subscription.remove();
    }
    return () => {
      listenerRef.current?.();
      listenerRef.current = null;
    };
  }, [loopInterval]);
};