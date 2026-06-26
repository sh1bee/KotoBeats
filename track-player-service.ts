import TrackPlayer, {
  Event,
} from '@rntp/player';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {});
  TrackPlayer.addEventListener(Event.RemotePause, () => {});
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (data) => {
    TrackPlayer.seekTo(data.position);
  });
};