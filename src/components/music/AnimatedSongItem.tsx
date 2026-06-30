import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '../../types';

// Ảnh cover được memo hóa – KHÔNG re-render khi isActive thay đổi
const MemoizedCover = React.memo(
  ({ uri }: { uri: string }) => (
    <Image source={{ uri }} style={styles.cover} fadeDuration={0} />
  ),
  (prev, next) => prev.uri === next.uri
);

interface Props {
  item: Song;
  isActive: boolean;
  onPress: (song: Song) => void;
}

const AnimatedSongItem = React.memo(({ item, isActive, onPress }: Props) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
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

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 20 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onPress(item)}>
      <Animated.View style={[styles.card, isActive && styles.cardActive, { transform: [{ scale: scaleAnim }] }]}>
        {/* Ảnh: View tĩnh, không animation */}
        <View style={[styles.coverWrap, isActive && styles.coverActive]}>
          {item.coverUrl ? (
            <MemoizedCover uri={item.coverUrl} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="musical-notes" size={24} color="#444" />
            </View>
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
        <View style={styles.info}>
          <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.artist, isActive && styles.artistActive]} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={isActive ? '#1DB954' : '#555'} />
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 20, backgroundColor: 'transparent' },
  cardActive: { backgroundColor: 'rgba(29,185,84,0.08)', borderWidth: 1, borderColor: 'rgba(29,185,84,0.2)' },
  coverWrap: { width: 60, height: 60, borderRadius: 16, marginRight: 16, overflow: 'hidden', backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: 'transparent'  },
  coverActive: { borderColor: '#1DB954' },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  equalizerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 16,
  },
  equalizerContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 20, gap: 2 },
  bar: { width: 3, height: 16, backgroundColor: '#1DB954', borderRadius: 1.5 },
  info: { flex: 1, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  titleActive: { color: '#1DB954' },
  artist: { color: '#888', fontSize: 14, fontWeight: '500' },
  artistActive: { color: 'rgba(29,185,84,0.7)' },
});

export default AnimatedSongItem;