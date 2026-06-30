// src/components/music/SquareSongCard.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import type { Song } from '../../types';

interface Props {
  song: Song;
  isActive: boolean;
  onPress: (song: Song) => void;
}

const SquareSongCard = React.memo(({ song, isActive, onPress }: Props) => {
  const bar1Anim = useRef(new Animated.Value(0.3)).current;
  const bar2Anim = useRef(new Animated.Value(0.3)).current;
  const bar3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      const createBarAnimation = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 300 + delay, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 300 + delay, useNativeDriver: true }),
          ])
        );
      const anim1 = createBarAnimation(bar1Anim, 0);
      const anim2 = createBarAnimation(bar2Anim, 100);
      const anim3 = createBarAnimation(bar3Anim, 200);
      anim1.start(); anim2.start(); anim3.start();
      return () => { anim1.stop(); anim2.stop(); anim3.stop(); };
    } else {
      bar1Anim.setValue(0.3); bar2Anim.setValue(0.3); bar3Anim.setValue(0.3);
    }
  }, [isActive]);

  return (
    <Pressable onPress={() => onPress(song)} style={styles.container}>
      <View style={styles.artwork}>
        {song.coverUrl ? (
          <Image source={song.coverUrl} style={styles.image} cachePolicy="memory-disk" />
        ) : (
          <View style={styles.placeholder} />
        )}
        {isActive && (
          <View style={styles.equalizerOverlay}>
            <View style={styles.equalizerContainer}>
              <Animated.View style={[styles.bar, { transform: [{ scaleY: bar1Anim }] }]} />
              <Animated.View style={[styles.bar, { transform: [{ scaleY: bar2Anim }] }]} />
              <Animated.View style={[styles.bar, { transform: [{ scaleY: bar3Anim }] }]} />
            </View>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: { width: 140, marginRight: 16 },
  artwork: {
    width: 140, height: 140, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#1A1A1A', marginBottom: 8, position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#222' },
  equalizerOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  equalizerContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 12, gap: 2 },
  bar: { width: 3, height: 12, backgroundColor: '#1DB954', borderRadius: 1.5 },
  title: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});

export default SquareSongCard;