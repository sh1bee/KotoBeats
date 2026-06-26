// src/services/playbackService.ts
import TrackPlayer, { Event } from '@rntp/player';

export const playbackService = async function () {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

    TrackPlayer.addEventListener(Event.RemoteNext, () => {
        TrackPlayer.skipToNext().catch(() => null);
    });

    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
        TrackPlayer.skipToPrevious().catch(() => null);
    });

    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
};