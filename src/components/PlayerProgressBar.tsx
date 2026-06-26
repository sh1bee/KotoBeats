import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer from '@rntp/player';
import { useTrackProgress } from '../hooks/useTrackProgress'; // 👈 import custom hook
import { useAudioStore } from '../store/audioStore';

interface PlayerProgressBarProps {
  duration?: number; // fallback
}

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs <= 0) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const PlayerProgressBar = React.memo(({ duration = 285 }: PlayerProgressBarProps) => {
  // Sử dụng custom hook thay vì useProgress từ package
  const { position: trackPosition, duration: trackDuration } = useTrackProgress(500);

  const finalDuration = trackDuration > 0 ? trackDuration : (duration && duration > 0 ? duration : 1);

  const setIgnoreStateChange = useAudioStore((state) => state.setIgnoreStateChange);
  const handleSeek = async (value: number) => {
    try {
      setIgnoreStateChange(true);
      await TrackPlayer.seekTo(value);
      setTimeout(() => setIgnoreStateChange(false), 800);
    } catch (error) {
      console.error('[PlayerProgressBar] Seek error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={finalDuration}
        value={trackPosition}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#333"
        thumbTintColor="#1DB954"
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(trackPosition)}</Text>
        <Text style={styles.timeText}>{formatTime(finalDuration)}</Text>
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