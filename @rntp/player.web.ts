import { useSyncExternalStore } from 'react';

type Listener = (data?: any) => void;
type ProgressState = {
  position: number;
  buffered: number;
  duration: number;
};

let audioInstance: HTMLAudioElement | null = null;
let currentTrack: any = null;
let progressState: ProgressState = {
  position: 0,
  buffered: 0,
  duration: 0,
};

const listeners: Record<string, Set<Listener>> = {};
const progressSubscribers = new Set<() => void>();
let progressFrame: number | null = null;

function createAudioElement() {
  if (typeof window === 'undefined' || audioInstance) {
    return audioInstance;
  }

  audioInstance = new Audio();
  audioInstance.preload = 'metadata';

  audioInstance.addEventListener('timeupdate', updateProgress);
  audioInstance.addEventListener('durationchange', updateProgress);
  audioInstance.addEventListener('loadedmetadata', updateProgress);
  audioInstance.addEventListener('progress', updateProgress);
  audioInstance.addEventListener('play', () => {
    triggerEvent(Event.PlaybackStateChanged, { state: PlaybackState.Playing });
    startProgressTicker();
  });
  audioInstance.addEventListener('pause', () => {
    triggerEvent(Event.PlaybackStateChanged, { state: PlaybackState.Paused });
    stopProgressTicker();
  });
  audioInstance.addEventListener('ended', () => {
    triggerEvent(Event.PlaybackStateChanged, { state: PlaybackState.Idle });
    stopProgressTicker();
  });

  return audioInstance;
}

function updateProgress() {
  if (!audioInstance) return;

  const buffered = audioInstance.buffered.length > 0
    ? audioInstance.buffered.end(audioInstance.buffered.length - 1)
    : 0;

  progressState = {
    position: audioInstance.currentTime || 0,
    buffered,
    duration: Number.isFinite(audioInstance.duration) ? audioInstance.duration : 0,
  };

  notifyProgressSubscribers();
}

function notifyProgressSubscribers() {
  progressSubscribers.forEach((subscriber) => subscriber());
}

function startProgressTicker() {
  if (progressFrame !== null) return;

  const tick = () => {
    updateProgress();
    if (audioInstance && !audioInstance.paused && !audioInstance.ended) {
      progressFrame = window.requestAnimationFrame(tick);
    } else {
      progressFrame = null;
    }
  };

  progressFrame = window.requestAnimationFrame(tick);
}

function stopProgressTicker() {
  if (progressFrame === null) return;

  window.cancelAnimationFrame(progressFrame);
  progressFrame = null;
}

function getListenerSet(event: string) {
  if (!listeners[event]) {
    listeners[event] = new Set();
  }

  return listeners[event];
}

function triggerEvent(event: string, data?: any) {
  getListenerSet(event).forEach((callback) => callback(data));
}

function subscribeProgress(subscriber: () => void) {
  progressSubscribers.add(subscriber);
  return () => {
    progressSubscribers.delete(subscriber);
  };
}

function getSnapshot() {
  return progressState;
}

const setupPlayer = (_options?: any): void => {
  createAudioElement();
  console.log('[TrackPlayer Web] Khởi tạo bộ âm thanh thành công');
};

const setMediaItem = (item: any): void => {
  const audio = createAudioElement();
  if (audio && item?.url) {
    currentTrack = item;
    audio.src = item.url;
    audio.load();
    updateProgress();
    console.log('[TrackPlayer Web] Đã nạp file nhạc:', item.url);
  }
};

const addMediaItem = (item: any): void => {
  setMediaItem(item);
};

const setMediaItems = (items: any[]): void => {
  if (items && items.length > 0) {
    setMediaItem(items[0]);
  }
};

const play = (): void => {
  const audio = createAudioElement();
  if (!audio || !currentTrack) return;

  try {
    audio.play();
  } catch (error) {
    console.log('[TrackPlayer Web] Trình duyệt chặn tự động phát, hãy nhấn nút Play:', error);
  }
};

const pause = (): void => {
  const audio = createAudioElement();
  audio?.pause();
};

const stop = (): void => {
  const audio = createAudioElement();
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  updateProgress();
};

const seekTo = (pos: number): void => {
  const audio = createAudioElement();
  if (!audio || !Number.isFinite(pos)) return;

  audio.currentTime = Math.max(0, pos);
  updateProgress();
};

const seekBy = (_offset: number): void => {};

const setVolume = (vol: number): void => {
  const audio = createAudioElement();
  if (!audio) return;

  audio.volume = Math.max(0, Math.min(1, vol));
};

const getVolume = (): number => {
  const audio = createAudioElement();
  return audio ? audio.volume : 1;
};

const skipToNext = (): void => {};
const skipToPrevious = (): void => {};
const skipToIndex = (_index: number): void => {};

const destroy = (): void => {
  const audio = createAudioElement();
  if (!audio) return;

  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  currentTrack = null;
  progressState = { position: 0, buffered: 0, duration: 0 };
  notifyProgressSubscribers();
};

const reset = (): void => {
  const audio = createAudioElement();
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  progressState = { position: 0, buffered: 0, duration: audio.duration || 0 };
  notifyProgressSubscribers();
};

const clear = (): void => {
  currentTrack = null;
  const audio = createAudioElement();
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  progressState = { position: 0, buffered: 0, duration: 0 };
  notifyProgressSubscribers();
};

const getQueue = (): any[] => (currentTrack ? [currentTrack] : []);
const getActiveMediaItem = (): any | null => currentTrack;
const getActiveMediaItemIndex = (): number | null => (currentTrack ? 0 : null);
const getCurrentTrack = (): any | null => currentTrack;

const isPlaying = (): boolean => {
  const audio = createAudioElement();
  return Boolean(audio && !audio.paused);
};

const getProgress = (): ProgressState => progressState;
const getPlaybackState = (): { state: PlaybackState } => {
  const audio = createAudioElement();
  if (!audio || !currentTrack) return { state: PlaybackState.Idle };
  if (audio.ended) return { state: PlaybackState.Ended };
  if (audio.paused) return { state: PlaybackState.Paused };
  return { state: PlaybackState.Playing };
};

const addEventListener = (event: string, callback: Listener) => {
  const eventListeners = getListenerSet(event);
  eventListeners.add(callback);

  return {
    remove: () => {
      eventListeners.delete(callback);
    },
  };
};

const setCommands = (_commands?: any): void => {};
const updateOptions = (): void => {};

const registerPlaybackService = (): void => {};
const registerBackgroundEventHandler = (): void => {};

const TrackPlayer = {
  setupPlayer,
  setMediaItem,
  addMediaItem,
  add: addMediaItem, // FIXED: Alias add() method for compatibility
  setMediaItems,
  play,
  pause,
  stop,
  seekTo,
  seekBy,
  setVolume,
  getVolume,
  skipToNext,
  skipToPrevious,
  skipToIndex,
  destroy,
  reset,
  clear,
  getQueue,
  getActiveMediaItem,
  getActiveMediaItemIndex,
  getCurrentTrack,
  isPlaying,
  getProgress,
  getPlaybackState,
  addEventListener,
  setCommands,
  updateOptions,
  registerPlaybackService,
  registerBackgroundEventHandler,
};

export const useProgress = (_interval?: number) => useSyncExternalStore(
  subscribeProgress,
  getSnapshot,
  getSnapshot
);

export default TrackPlayer;

export enum Event {
  RemotePlay = 'event.remote-play',
  RemotePause = 'event.remote-pause',
  RemoteStop = 'event.remote-stop',
  RemoteSeek = 'event.remote-seek',
  RemoteNext = 'event.remote-next',
  RemotePrevious = 'event.remote-previous',
  PlaybackStateChanged = 'event.playback-state-changed',
  IsPlayingChanged = 'event.is-playing-changed',
  MediaItemTransition = 'event.media-item-transition',
  MediaMetadataChanged = 'event.media-metadata-changed',
  PlaybackError = 'event.playback-error',
  QueueChanged = 'event.queue-changed',
}

export enum PlaybackState {
  None = 'none',
  Idle = 'idle',
  Ready = 'ready',
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Buffering = 'buffering',
  Loading = 'loading',
  Ended = 'ended',
  Error = 'error',
}

export enum PlayerCommand {
  PlayPause = "playPause",
  Stop = "stop",
  Seek = "seek",
  Next = "next",
  Previous = "previous",
  SkipForward = "skipForward",
  SkipBackward = "skipBackward",
}

export enum RepeatMode {
  Off = "off",
  One = "one",
  All = "all",
}

export enum Capability {
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  SeekTo = 'seekTo',
}

export enum AppKilledPlaybackBehavior {
  StopPlaybackAndRemoveNotification = 'stop-playback-and-remove-notification',
}
