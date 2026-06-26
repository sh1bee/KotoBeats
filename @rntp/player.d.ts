declare module '@rntp/player' {
  import { EmitterSubscription } from 'react-native';

  export interface MediaItem {
    mediaId?: string;
    url: string | number | { uri: string | number; headers?: Record<string, string>; bundle?: string };
    title?: string;
    artist?: string;
    albumTitle?: string;
    artworkUrl?: string | number | { uri: string | number; headers?: Record<string, string>; bundle?: string };
    duration?: number;
    isLive?: boolean;
    mimeType?: string;
    extras?: Record<string, unknown>;
    [key: string]: any;
  }

  export type PlaybackState = {
    state: 'none' | 'idle' | 'ready' | 'playing' | 'paused' | 'stopped' | 'buffering' | 'loading' | 'ended' | 'error';
  };

  export interface Progress {
    position: number;
    buffered: number;
    duration: number;
  }

  export enum Event {
    PlaybackStateChanged = "event.playback-state-changed",
    IsPlayingChanged = "event.is-playing-changed",
    MediaItemTransition = "event.media-item-transition",
    MediaMetadataChanged = "event.media-metadata-changed",
    MetadataReceived = "event.metadata-received",
    PlaybackError = "event.playback-error",
    PlaybackProgressUpdated = "event.playback-progress-updated",
    QueueChanged = "event.queue-changed",
    RemotePlay = "event.remote-play",
    RemotePause = "event.remote-pause",
    RemoteNext = "event.remote-next",
    RemotePrevious = "event.remote-previous",
    RemoteStop = "event.remote-stop",
    RemoteSeek = "event.remote-seek",
    RemoteSkipForward = "event.remote-skip-forward",
    RemoteSkipBackward = "event.remote-skip-backward",
    SleepTimerTriggered = "event.sleep-timer-triggered",
  }

  export enum PlayerCommand {
    Seek = "seek",
    PlayPause = "playPause",
    Next = "next",
    Previous = "previous",
    Stop = "stop",
    SkipForward = "skipForward",
    SkipBackward = "skipBackward",
  }

  export enum RepeatMode {
    Off = "off",
    One = "one",
    All = "all",
  }

  export enum Capability {
    Play = "play",
    Pause = "pause",
    Stop = "stop",
    SeekTo = "seekTo",
  }

  interface TrackPlayerType {
    setupPlayer(options?: any): void;
    setMediaItem(item: MediaItem): void;
    addMediaItem(item: MediaItem): void;
    add: (item: MediaItem | MediaItem[]) => void;
    setMediaItems(items: MediaItem[], startIndex?: number): void;
    reset(): void;
    play(): void;
    pause(): void;
    stop(): void;
    seekTo(position: number): void;
    seekBy(offset: number): void;
    setVolume(volume: number): void;
    getVolume(): number;
    getActiveMediaItem(): MediaItem | null;
    getActiveMediaItemIndex(): number | null;
    getCurrentTrack(): MediaItem | null;
    getQueue(): MediaItem[];
    isPlaying(): boolean;
    getProgress(): Progress;
    getPlaybackState(): PlaybackState;
    addEventListener<T extends Event>(event: T, listener: (data: any) => void): EmitterSubscription;
    setCommands(options?: any): void;
    updateOptions(): void;
    destroy(): void;
    registerPlaybackService(): void;
    registerBackgroundEventHandler(factory: () => (event: any) => Promise<void>): void;
  }

  const TrackPlayer: TrackPlayerType;
  export default TrackPlayer;

  export function useProgress(updateInterval?: number): Progress;
}