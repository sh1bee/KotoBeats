import TrackPlayer, { PlayerCommand } from '@rntp/player';
import type { PlayerCommand as RNPlayerCommand } from '@rntp/player';

export const setupTrackPlayer = async (): Promise<boolean> => {
  const config = {
    contentType: 'music' as const,
    handleAudioBecomingNoisy: true,
    android: { 
      taskRemovedBehavior: 'continue' as const,
      wakeMode: 'none' as const,
    },
  };
  
  await TrackPlayer.setupPlayer(config);

  TrackPlayer.setCommands({
    capabilities: [
      PlayerCommand.PlayPause,
      PlayerCommand.Stop,
      PlayerCommand.Seek,
    ] as RNPlayerCommand[],
    forwardInterval: 30,
    backwardInterval: 15,
  });

  return true;
};
