// src/hooks/useTrackProgress.ts
import { useEffect, useState } from 'react';
import TrackPlayer from '@rntp/player';

export const useTrackProgress = (intervalMs = 500) => {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { position: pos, duration: dur } = await TrackPlayer.getProgress();
        setPosition(pos);
        setDuration(dur);
      } catch (e) {
        // ignore errors when player is not ready
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return { position, duration };
};