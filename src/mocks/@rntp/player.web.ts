import { useSyncExternalStore } from 'react';

let audioInstance: HTMLAudioElement | null = null;
let isTrackPlaying = false;
let currentPosition = 0;
let currentDuration = 285;
let progressCallbacks: Array<(pos: number) => void> = [];
let intervalId: ReturnType<typeof setInterval> | null = null;

const startProgressTracking = () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (isTrackPlaying && audioInstance) {
      currentPosition = audioInstance.currentTime;
      progressCallbacks.forEach(cb => cb(currentPosition));
    }
  }, 250);
};

export const useProgress = (_interval?: number) => {
  return useSyncExternalStore(
    (callback) => {
      progressCallbacks.push(callback);
      startProgressTracking();
      return () => {
        progressCallbacks = progressCallbacks.filter(cb => cb !== callback);
      };
    },
    () => ({ position: currentPosition, buffered: currentPosition, duration: currentDuration })
  );
};

const seekTo = (pos: number) => {
  if (audioInstance) {
    audioInstance.currentTime = pos;
    currentPosition = pos;
  }
};

const setVolume = (vol: number) => {
  if (audioInstance) {
    audioInstance.volume = vol;
  }
};

const play = () => {
  if (audioInstance) {
    void audioInstance.play();
    isTrackPlaying = true;
  }
};

const pause = () => {
  if (audioInstance) {
    audioInstance.pause();
    isTrackPlaying = false;
  }
};

const loadAudio = (url: string) => {
  if (typeof window !== 'undefined') {
    audioInstance = new window.Audio(url);
    audioInstance.addEventListener('loadedmetadata', () => {
      currentDuration = audioInstance?.duration || currentDuration;
    });
  }
};

const TrackPlayer = {
  setMediaItems: async (items: any[]) => {
    if (items && items.length > 0) {
      loadAudio(items[0].url);
    }
  },
  setMediaItem: async (item: any) => {
    loadAudio(item.url);
  },
  addMediaItem: async (item: any) => loadAudio(item.url),
  add: async (item: any) => loadAudio(item.url),
  reset: async () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance = null;
    }
    isTrackPlaying = false;
    currentPosition = 0;
  },
  seekTo,
  setVolume,
  play,
  pause,
  stop: async () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
    isTrackPlaying = false;
    currentPosition = 0;
  },
  setupPlayer: async () => true,
  addEventListener: () => ({ remove: () => {} }),
  setCommands: async () => {},
  getActiveMediaItem: () => null,
  getState: () => isTrackPlaying ? 'playing' : 'paused',
  getPosition: async () => currentPosition,
};

export default TrackPlayer;

export enum Event {
  RemotePlay = 'event.remote-play',
  RemotePause = 'event.remote-pause',
  RemoteStop = 'event.remote-stop',
  RemoteSeek = 'event.remote-seek',
  PlaybackStateChanged = 'event.playback-state-changed',
  IsPlayingChanged = 'event.is-playing-changed',
  MediaItemTransition = 'event.media-item-transition',
}

export enum PlayerCommand {
  PlayPause = 'play-pause',
  Stop = 'stop',
  Seek = 'seek',
  Next = 'next',
  Previous = 'previous',
}
