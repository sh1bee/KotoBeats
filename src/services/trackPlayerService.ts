// src/services/trackPlayerService.ts
import TrackPlayer, { 
  PlayerCommand, 
  useProgress, 
  useIsPlaying 
} from '@rntp/player';
import type { PlayerCommand as RNPlayerCommand } from '@rntp/player';
import type { Song } from '../types';

export const setupTrackPlayer = async (): Promise<boolean> => {
  try {
    const config = {
      contentType: 'music' as const,
      handleAudioBecomingNoisy: true,
      android: { 
        taskRemovedBehavior: 'continue' as const,
        wakeMode: 'none' as const,
      },
    };
    
    // 1. Setup player bằng cấu hình v5 chuẩn của bạn trên GitHub
    try {
      await TrackPlayer.setupPlayer(config);
      console.log('✅ TrackPlayer setup thành công');
    } catch (e: any) {
      if (e?.message?.includes('already set up') || e?.code === 'player_already_setup') {
        console.log('✅ TrackPlayer đã được setup từ trước (Hot reload), bỏ qua.');
      } else {
        throw e;
      }
    }

    // 2. Cấu hình các nút điều khiển bằng lệnh setCommands() mới của v5
    await TrackPlayer.setCommands({
      capabilities: [
        PlayerCommand.PlayPause,
        PlayerCommand.Stop,
        PlayerCommand.Next,      // thêm
        PlayerCommand.Previous,  // thêm
        PlayerCommand.Seek,
      ] as RNPlayerCommand[],
      forwardInterval: 30,
      backwardInterval: 15,
    });

    return true;
  } catch (error) {
    console.error('[TrackPlayer Setup Error]:', error);
    return false;
  }
};

// Load và play bài hát (Sử dụng API v5)
export const loadAndPlaySong = async (playlist: Song[], startIndex: number): Promise<void> => {
  try {
    const items = playlist.map(song => ({
      mediaId: song._id,
      url: song.audioUrl,
      title: song.title,
      artist: song.artist || 'Unknown',
      artworkUrl: song.coverUrl,
      duration: song.duration ?? 0,
    }));

    await TrackPlayer.setMediaItems(items);
    // Nhảy đến đúng bài muốn phát (startIndex)
    await TrackPlayer.skipToIndex(startIndex);
    await TrackPlayer.play();
  } catch (error) {
    console.error(`[TrackPlayer Play Error]:`, error);
  }
};

// Dừng phát và dọn dẹp hàng chờ (Sử dụng API v5)
export const stopAndClearTrackPlayer = async (): Promise<void> => {
  try {
    await TrackPlayer.stop();
    // Thay thế cho reset() trong v5 là gán mảng rỗng vào setMediaItems
    await TrackPlayer.setMediaItems([]); 
  } catch (e) {
    console.error('[TrackPlayer Stop Error]:', e);
  }
};

export const seekToPosition = async (position: number): Promise<void> => {
  try {
    await TrackPlayer.seekTo(position);
  } catch (error) {
    console.error('[TrackPlayer Seek Error]:', error);
  }
};

export const setPlaybackVolume = async (volume: number): Promise<void> => {
  try {
    await TrackPlayer.setVolume(volume);
  } catch (error) {
    console.error('[TrackPlayer Volume Error]:', error);
  }
};

// Re-export hooks để các màn hình khác tiện import
export { useIsPlaying, useProgress };