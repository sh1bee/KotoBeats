import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAudioStore } from '../store/audioStore';
import { fetchSongsFromFirebase } from '../services/firebase/dbService';
import TrackPlayer from '@rntp/player';
import type { Song } from '../types';
import SectionHeader from '../components/music/SectionHeader';
import FilterChipsRow from '../components/music/FilterChipsRow';
import QuickPicksCarousel from '../components/music/QuickPicksCarousel';
import QuickPlayGrid from '../components/music/QuickPlayGrid';
import AnimatedSongItem from '../components/music/AnimatedSongItem';
import AlbumCard from '../components/music/AlbumCard';
import { useMusicData } from '../hooks/useMusicData';
import type { Album } from '../utils/musicDataUtils';
const MusicScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const playlist = useAudioStore((state) => state.playlist);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const currentSong = useAudioStore((state) => state.currentSong);
  const [loading, setLoading] = useState(!playlist.length);
  const [searchQuery, setSearchQuery] = useState('');
  const { quickPicks, quickPlay, albums } = useMusicData();

  useEffect(() => {
    if (playlist.length === 0) {
      const load = async () => {
        try {
          const songs = await fetchSongsFromFirebase();
          setPlaylist(songs);
        } catch (e) { console.error('Failed to fetch songs:', e); }
        finally { setLoading(false); }
      };
      load();
    }
  }, []);

  const handleAlbumPress = useCallback((album: Album) => {
    navigation.navigate('AlbumDetail', { album });
  }, [navigation]);

  const handlePlaySong = useCallback(async (song: Song) => {
    useAudioStore.getState().setCurrentAlbumSongs(null);
    setCurrentSong(song);
    const finalPlaylist = useAudioStore.getState().playlist;
    const startIndex = Array.isArray(finalPlaylist) ? finalPlaylist.findIndex(s => s._id === song._id) : 0;
    await TrackPlayer.setMediaItems(finalPlaylist.map(s => ({
      mediaId: s._id, url: s.audioUrl, title: s.title, artist: s.artist, artwork: s.coverUrl,
    })));
    await TrackPlayer.skipToIndex(startIndex);
    await TrackPlayer.play();
    setIsPlaying(true);
    navigation.navigate('PlayerScreen');
  }, [setCurrentSong, setIsPlaying, navigation]);

  const handlePressItem = useCallback((song: Song) => {
    if (currentSong?._id === song._id) navigation.navigate('PlayerScreen');
    else handlePlaySong(song);
  }, [currentSong, handlePlaySong, navigation]);

  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return playlist;
    const q = searchQuery.toLowerCase();
    return playlist.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [playlist, searchQuery]);

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
        colors={['rgba(29,185,84,0.22)', 'rgba(92,36,255,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0.8 }}
        style={styles.ambientGlow}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.title}>Thư viện của bạn</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Home', { screen: 'Profile' })}>
            <View style={styles.avatarInner}><Text style={styles.avatarText}>D</Text></View>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
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

        {searchQuery.length > 0 ? (
          // Khi tìm kiếm, hiển thị FlatList đơn giản như cũ (có thể tái sử dụng AnimatedSongItem)
          <View style={{ paddingHorizontal: 20 }}>
            {filteredPlaylist.map(song => (
              <AnimatedSongItem key={song._id} item={song} isActive={currentSong?._id === song._id} onPress={handlePressItem} />
            ))}
          </View>
        ) : (
          <>
            {/* Filter Chips */}
            <FilterChipsRow />

            {/* Quick Picks Carousel */}
            <SectionHeader title="Chọn nhanh đài phát" icon="flash" />
            <QuickPicksCarousel songs={quickPicks} currentSongId={currentSong?._id} onSongPress={handlePressItem} />

            {/* Quick Play Grid */}
            <SectionHeader title="Phát nhanh" icon="albums" />
            <QuickPlayGrid songs={quickPlay} currentSongId={currentSong?._id} onSongPress={handlePressItem} />
          </>
        )}

        {/* Section Album Dành Cho Bạn */}
        {albums.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Album Dành Cho Bạn" icon="disc" />
            <FlatList
              data={albums}
              renderItem={({ item }: { item: Album }) => (
                <AlbumCard album={item} onPress={handleAlbumPress} />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  ambientGlow: { position: 'absolute', top: 0, left: 0, width: 500, height: 500 },
  scrollContent: { paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 70, paddingBottom: 20 },
  greeting: { color: '#888', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  avatar: { borderRadius: 24, backgroundColor: 'rgba(29,185,84,0.2)', padding: 2 },
  avatarInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1DB954', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 16, height: 54, marginHorizontal: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16 },
});

export default MusicScreen;