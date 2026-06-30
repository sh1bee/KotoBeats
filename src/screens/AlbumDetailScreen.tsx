// src/screens/AlbumDetailScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TrackPlayer from '@rntp/player';
import { useAudioStore } from '../store/audioStore';
import type { Song } from '../types';
import type { Album } from '../utils/musicDataUtils';
import AnimatedSongItem from '../components/music/AnimatedSongItem';

// Định nghĩa kiểu cho navigation stack của Music
type MusicStackParamList = {
  MusicMain: undefined;
  PlayerScreen: undefined;
  AlbumDetail: { album: Album };
};

const { width } = Dimensions.get('window');
const COVER_SIZE = width * 0.6;

export const AlbumDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MusicStackParamList>>();
  const route = useRoute();
  const { album } = route.params as { album: Album };
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const currentSong = useAudioStore((state) => state.currentSong);

  const handlePlaySong = useCallback(
    async (song: Song) => {
      if (!Array.isArray(album.songs)) return; // 👈 Thêm dòng này
      useAudioStore.getState().setCurrentAlbumSongs(album.songs);
      setCurrentSong(song);
      await TrackPlayer.setMediaItems(
        album.songs.map((s) => ({
          mediaId: s._id,
          url: s.audioUrl,
          title: s.title,
          artist: s.artist,
          artwork: s.coverUrl,
        }))
      );
      const index = album.songs.findIndex((s) => s._id === song._id);
      await TrackPlayer.skipToIndex(index >= 0 ? index : 0);
      await TrackPlayer.play();
      setIsPlaying(true);
      navigation.navigate('PlayerScreen');
    },
    [album, setCurrentSong, setIsPlaying, navigation]
  );

  const handlePlayAll = useCallback(async () => {
    if (!Array.isArray(album.songs) || album.songs.length === 0) return;
    useAudioStore.getState().setCurrentAlbumSongs(album.songs);
    const firstSong = album.songs[0];
    setCurrentSong(firstSong);
    await TrackPlayer.setMediaItems(
      album.songs.map((s) => ({
        mediaId: s._id,
        url: s.audioUrl,
        title: s.title,
        artist: s.artist,
        artwork: s.coverUrl,
      }))
    );
    await TrackPlayer.skipToIndex(0);
    await TrackPlayer.play();
    setIsPlaying(true);
    navigation.navigate('PlayerScreen');
  }, [album, setCurrentSong, setIsPlaying, navigation]);

  const handleSongPress = useCallback(
    (song: Song) => {
      if (currentSong?._id === song._id) {
        navigation.navigate('PlayerScreen');
      } else {
        handlePlaySong(song);
      }
    },
    [currentSong, handlePlaySong, navigation]
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <AnimatedSongItem
        item={item}
        isActive={currentSong?._id === item._id}
        onPress={handleSongPress}
      />
    ),
    [currentSong, handleSongPress]
  );

  return (
    <View style={styles.container}>
      {/* Nền mờ từ ảnh cover + gradient tối */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={album.coverUrl}
          style={styles.backgroundImage}
          blurRadius={60}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', '#000']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.8]}
        />
      </View>

      {/* Nội dung chính */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Album</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.albumInfo}>
        <Image source={album.coverUrl} style={styles.cover} cachePolicy="memory-disk" />
        <Text style={styles.albumTitle}>{album.title}</Text>
        <Text style={styles.songCount}>{album.songs.length} bài hát</Text>
      </View>

      <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
        <Ionicons name="play-circle" size={24} color="#000" />
        <Text style={styles.playAllText}>Phát tất cả</Text>
      </TouchableOpacity>

      <FlatList
        data={album.songs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// styles giữ nguyên như trước
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  albumInfo: { alignItems: 'center', marginBottom: 20 },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
  },
  albumTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  songCount: { color: '#888', fontSize: 14, marginTop: 4 },
  playAllButton: {
    flexDirection: 'row',
    backgroundColor: '#1DB954',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  playAllText: { color: '#000', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
});