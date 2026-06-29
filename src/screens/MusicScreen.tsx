// src/screens/MusicScreen.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAudioStore } from '../store/audioStore';
import { fetchSongsFromFirebase } from '../services/firebase/dbService';
import TrackPlayer from '@rntp/player';
import type { Song } from '../types';

const { width } = Dimensions.get('window');

// Ảnh cover không bị re-render khi isActive thay đổi
const MemoizedCover = React.memo(
  ({ uri }: { uri: string }) => (
    <Image source={{ uri }} style={styles.songCover} fadeDuration={0} />
  ),
  (prev, next) => prev.uri === next.uri
);

// --- COMPONENT ANIMATED SONG ITEM ---
const AnimatedSongItem = React.memo(({ 
  item, 
  isActive, 
  onPress 
}: { 
  item: Song; 
  isActive: boolean; 
  onPress: (song: Song) => void 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animation cho equalizer bars
  const bar1Anim = useRef(new Animated.Value(0.3)).current;
  const bar2Anim = useRef(new Animated.Value(0.3)).current;
  const bar3Anim = useRef(new Animated.Value(0.3)).current;

  // Chạy animation equalizer khi active
  useEffect(() => {
    if (isActive) {
      const createBarAnimation = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + delay,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300 + delay,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createBarAnimation(bar1Anim, 0);
      const anim2 = createBarAnimation(bar2Anim, 100);
      const anim3 = createBarAnimation(bar3Anim, 200);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      bar1Anim.setValue(0.3);
      bar2Anim.setValue(0.3);
      bar3Anim.setValue(0.3);
    }
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 20 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onPress(item)}>
      <Animated.View style={[styles.songCard, isActive && styles.songCardActive, { transform: [{ scale: scaleAnim }] }]}>
        {/* Ảnh cover – không bị ảnh hưởng bởi isActive ngoại trừ viền glow nhẹ */}
        <View style={[styles.songCoverContainer, isActive && styles.songCoverActive]}>
          {item.coverUrl ? (
            <MemoizedCover uri={item.coverUrl} />
          ) : (
            <View style={styles.songCoverPlaceholder}>
              <Ionicons name="musical-notes" size={24} color="#444" />
            </View>
          )}
          
          {/* Overlay equalizer bars khi active */}
          {isActive && (
            <View style={styles.activeCoverOverlay}>
              <View style={styles.equalizerContainer}>
                <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: bar1Anim }] }]} />
                <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: bar2Anim }] }]} />
                <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: bar3Anim }] }]} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isActive && styles.songTitleActive]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.songArtist, isActive && styles.songArtistActive]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#555" />
        </TouchableOpacity>
      </Animated.View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom compare để re-render khi isActive thay đổi
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.isActive === nextProps.isActive
  );
});


// --- MAIN SCREEN ---
const MusicScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const playlist = useAudioStore((state) => state.playlist);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const currentSong = useAudioStore((state) => state.currentSong);

  const [loading, setLoading] = useState(!playlist.length);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (playlist.length === 0) {
      const load = async () => {
        try {
          const songs = await fetchSongsFromFirebase();
          setPlaylist(songs);
        } catch (e) {
          console.error('Failed to fetch songs:', e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, []);

  const handlePlaySong = useCallback(
    async (song: Song) => {
      setCurrentSong(song);
      const finalPlaylist = useAudioStore.getState().playlist;
      const startIndex = finalPlaylist.findIndex(s => s._id === song._id) || 0;

      await TrackPlayer.setMediaItems(
        finalPlaylist.map(s => ({
          mediaId: s._id,
          url: s.audioUrl,
          title: s.title,
          artist: s.artist,
          artwork: s.coverUrl,
        }))
      );
      await TrackPlayer.skipToIndex(startIndex);
      await TrackPlayer.play();
      setIsPlaying(true);
      navigation.navigate('PlayerScreen');
    },
    [setCurrentSong, setIsPlaying, navigation]
  );

  const handlePressItem = useCallback(
    (song: Song) => {
      if (currentSong?._id === song._id) {
        navigation.navigate('PlayerScreen');
      } else {
        handlePlaySong(song);
      }
    },
    [currentSong, handlePlaySong, navigation]
  );

  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return playlist;
    const query = searchQuery.toLowerCase();
    return playlist.filter(
      (song) => song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)
    );
  }, [playlist, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: Song }) => {
      const isActive = currentSong?._id === item._id;
      return <AnimatedSongItem item={item} isActive={isActive} onPress={handlePressItem} key={`${item._id}-${currentSong?._id}`}/>;
    },
    [currentSong, handlePressItem]
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#040406', '#06060a', '#000000']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(29, 185, 84, 0.22)', 'rgba(92, 36, 255, 0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={styles.ambientGlowTopLeft}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Xin chào,</Text>
          <Text style={styles.headerTitle}>Thư viện của bạn</Text>
        </View>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('Home', { screen: 'Profile' })}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bài hát, nghệ sĩ..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredPlaylist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="planet-outline" size={80} color="#222" />
          <Text style={styles.emptyText}>{searchQuery ? 'Không gian tĩnh lặng' : 'Thư viện trống'}</Text>
          <Text style={styles.emptySubtext}>{searchQuery ? 'Thử một từ khóa khác xem sao' : 'Khám phá và thêm bài hát mới ngay'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlaylist}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          extraData={currentSong}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

export default MusicScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  ambientGlowTopLeft: {
    position: 'absolute', top: 0, left: 0,
    width: width * 1, height: width * 3.5, zIndex: 0,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 24, paddingTop: 70, paddingBottom: 20, zIndex: 10,
  },
  headerGreeting: { color: '#888', fontSize: 14, fontWeight: '500', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  avatarContainer: { padding: 2, borderRadius: 24, backgroundColor: 'rgba(29, 185, 84, 0.2)' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1DB954', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  searchWrapper: { paddingHorizontal: 24, marginBottom: 24, zIndex: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, height: '100%', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { color: '#FFF', fontSize: 20, fontWeight: '700', marginTop: 24 },
  emptySubtext: { color: '#888', fontSize: 15, marginTop: 8, textAlign: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 140 },

  // Song Item
  songCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 20, backgroundColor: 'transparent',
  },
  songCardActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.08)', borderWidth: 1, borderColor: 'rgba(29, 185, 84, 0.2)',
  },
  songCoverContainer: {
    width: 60, height: 60, borderRadius: 16, marginRight: 16, overflow: 'hidden', backgroundColor: '#1A1A1A',
  },
  songCoverActive: {
    // Chỉ giữ viền glow, không đổ bóng hay nền đè ảnh
    borderWidth: 2, borderColor: '#1DB954',
  },
  songCover: { width: '100%', height: '100%' },
  songCoverPlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#222', justifyContent: 'center', alignItems: 'center',
  },

  songInfo: { flex: 1, justifyContent: 'center' },
  songTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 4, letterSpacing: 0.2 },
  songTitleActive: { color: '#1DB954' },
  songArtist: { color: '#888', fontSize: 14, fontWeight: '500' },
  songArtistActive: { color: 'rgba(29, 185, 84, 0.7)' },
  moreButton: { padding: 8 },
    // Overlay equalizer khi active
  activeCoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 20,
    gap: 2,
  },
  equalizerBar: {
    width: 3,
    height: 16,
    backgroundColor: '#1DB954',
    borderRadius: 1.5,
  },
});