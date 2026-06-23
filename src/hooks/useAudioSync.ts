import { useEffect } from 'react';
import TrackPlayer, { useProgress } from '@rntp/player';
import { useAudioStore } from '../store/audioStore';

export const useAudioSync = () => {
  const { position } = useProgress(0.25); // Cập nhật mỗi 250ms (0.25 giây)
  const setPlaybackPosition = useAudioStore((state) => state.setPlaybackPosition);
  const loopInterval = useAudioStore((state) => state.loopInterval);

  useEffect(() => {
    // Cập nhật lên Store
    console.log('--- SYNC --- Position từ RNTP:', position);
    setPlaybackPosition(position);

    // Xử lý Loop: Chỉ seek nếu đang trong khoảng lặp
    if (loopInterval && position >= loopInterval.end) {
      console.log('[AudioSync] Loop reached, seeking to:', loopInterval.start);
      // Dùng .seek() thay vì .seekTo() cho V5
      void TrackPlayer.seekTo(loopInterval.start);
    }
  }, [position, loopInterval, setPlaybackPosition]);
};