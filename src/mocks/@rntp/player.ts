import React from 'react';

export const useProgress = (_interval?: number) => {
  const [state, setState] = React.useState({ position: 0, buffered: 0, duration: 285 });
  
  React.useEffect(() => {
    // Mô phỏng progress tăng khi có interval > 0
    if (_interval && _interval > 0) {
      const interval = setInterval(() => {
        setState(s => ({ ...s, position: (s.position + 0.1) % 285 }));
      }, _interval);
      return () => clearInterval(interval);
    }
  }, [_interval]);
  
  return state;
};

const TrackPlayer = {
  setMediaItem: async (_item: any) => null,
  addMediaItem: async (_item: any) => null,
  add: async (_item: any) => null,
  reset: async () => {},
  seekTo: async (_pos: number) => {},
  setVolume: async (_vol: number) => {},
  play: async () => {},
  pause: async () => {},
  stop: async () => {},
  setupPlayer: async (_options?: any) => true,
  addEventListener: (_event: string, _callback: any) => ({ remove: () => {} }),
  setCommands: async (_commands?: any) => {},
  getActiveMediaItem: () => null,
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