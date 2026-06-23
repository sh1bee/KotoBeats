import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer from '@rntp/player';
import { useAudioStore } from '../store/audioStore';

interface PlayerProgressBarProps {
  duration?: number;
}

const formatTime = (secs: number) => {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60).toString().padStart(2, '0'); // Sửa: padStart
  return `${minutes}:${seconds}`;
};

export const PlayerProgressBar = React.memo(({ duration = 285 }: PlayerProgressBarProps) => {
  const playbackPosition = useAudioStore((state) => state.playbackPosition);
  
  const handleSeek = async (value: number) => {
    try {
      await TrackPlayer.seekTo(value);
    } catch (error) {
      console.error('[PlayerProgressBar] Seek error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration || 1}
        value={playbackPosition}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#333"
        thumbTintColor="#1DB954"
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
});

PlayerProgressBar.displayName = 'PlayerProgressBar';

const styles = StyleSheet.create({
  container: { width: '100%' },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { color: '#888', fontSize: 12, fontVariant: ['tabular-nums'] },
});