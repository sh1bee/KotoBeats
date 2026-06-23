import { useSyncExternalStore } from 'react';

export const useProgress = (_interval?: number) => {
  return useSyncExternalStore(
    () => () => {},
    () => ({ position: 0, buffered: 0, duration: 0 })
  );
};

const seekTo = (_pos: number) => {};
const setVolume = (_vol: number) => {};
const play = () => {};
const pause = () => {};

const TrackPlayer = {
  seekTo,
  setVolume,
  play,
  pause,
};

export default TrackPlayer;
