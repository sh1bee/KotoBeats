// src/components/MiniPlayer.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAudioStore } from '../store/audioStore';
import TrackPlayer from '@rntp/player';

interface Props {
  isPlayerVisible?: boolean;
}

const MiniPlayer: React.FC<Props> = ({ isPlayerVisible }) => {
  const navigation = useNavigation<any>();
  const currentSong = useAudioStore((state) => state.currentSong);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
    }
  }, [isPlaying]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePlayPause = async (e: any) => {
    e.stopPropagation?.();
    if (isPlaying) {
      await TrackPlayer.pause();
      setIsPlaying(false);
    } else {
      await TrackPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleOpenPlayer = () => {
    console.log('🎧 MiniPlayer pressed, navigating to PlayerScreen');
    navigation.navigate('Music', { screen: 'PlayerScreen' });
  };

  const handlePrevious = async (e: any) => {
    e.stopPropagation?.();
    try { await TrackPlayer.skipToPrevious(); } catch {}
  };

  const handleNext = async (e: any) => {
    e.stopPropagation?.();
    try { await TrackPlayer.skipToNext(); } catch {}
  };

  // Nếu đang ở PlayerScreen hoặc không có bài hát, ẩn MiniPlayer
  if (isPlayerVisible || !currentSong) return null;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={handleOpenPlayer}>
      <View style={styles.inner}>
        <Animated.View style={[styles.diskContainer, { transform: [{ rotate: spin }] }]}>
          <View style={styles.disk}>
            <View style={styles.diskCenter} />
          </View>
        </Animated.View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideButton} onPress={handlePrevious}>
            <Ionicons name="play-skip-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideButton} onPress={handleNext}>
            <Ionicons name="play-skip-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MiniPlayer;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 8,
    zIndex: 100,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diskContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disk: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diskCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButton: {
    padding: 8,
  },
});