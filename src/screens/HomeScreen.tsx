import React, { useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { fetchSongsFromFirebase } from '../services/firebase/dbService';
import { useAudioStore } from '../store/audioStore';
import { useFlashcardStore } from '../store/flashcardStore';
import TrackPlayer from '@rntp/player';
import type { Song } from '../types';

interface SongCardProps {
  song: Song;
  onPress: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, onPress }) => {
  return (
    <TouchableOpacity style={styles.songCard} onPress={onPress}>
      <View style={[styles.songCover, { backgroundColor: '#1E1E1E' }]}>
        <Ionicons name="musical-notes" size={32} color="#1DB954" />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
      </View>
      <View style={styles.playOverlay}>
        <Ionicons name="play" size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const playlist = useAudioStore((state) => state.playlist);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setLoopInterval = useAudioStore((state) => state.setLoopInterval);
  
  const deck = useFlashcardStore((state) => state.deck);
  const dueCardsCount = deck.filter(
    (card) => new Date(card.srs.nextReviewDate) <= new Date()
  ).length;

  const [loading, setLoading] = React.useState(true);

  // FIXED: Fetch songs from Firebase on mount
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const songs = await fetchSongsFromFirebase();
        setPlaylist(songs);
      } catch (error) {
        console.error('[Home] Failed to fetch songs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, [setPlaylist]);

  // FIXED: Dùng chuẩn API V5 của @rntp/player
  const handleSongPress = useCallback(
    async (song: Song) => {
      try {
        setLoopInterval(null);
        setCurrentSong(song);

        // Sử dụng setMediaItems (thay thế cho cả reset và add)
        // Nó nhận vào một mảng chứa object bài hát
        await TrackPlayer.setMediaItems([{
          id: song._id,
          url: song.audioUrl,
          title: song.title,
          artist: song.artist,
          artwork: song.coverUrl 
        }]);

        await TrackPlayer.play();
        setIsPlaying(true);

        // Chuyển sang màn hình Player
        navigation.navigate('Player');
        
      } catch (error) {
        console.error('[Home] Lỗi khi tải bài hát:', error);
      }
    },
    [setCurrentSong, setIsPlaying, setLoopInterval, navigation]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Đang tải bài hát...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Chào buổi sáng, Đạt!</Text>
          <View style={styles.streakContainer}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.streakText}>Streak: 12 days</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>D</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Tiếp tục học</Text>
          <View style={styles.heroContent}>
            <Text style={styles.heroSongTitle}>Khám phá bài hát mới</Text>
            <Text style={styles.heroSongArtist}>Hãy chọn một bài để bắt đầu</Text>
            <TouchableOpacity style={styles.heroPlayBtn}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.srsCard}>
          <LinearGradient
            colors={['#1DB954', '#00F0FF']}
            style={styles.srsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="book" size={24} color="#FFFFFF" />
            <Text style={styles.srsTitle}>Ôn tập SRS hôm nay</Text>
            <Text style={styles.srsCount}>Có {dueCardsCount} thẻ đang chờ!</Text>
            <Text style={styles.srsSubtitle}>Chạm để bắt đầu học</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thư viện bài hát</Text>
          {playlist.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài hát nào</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {playlist.map((song) => (
                <SongCard
                  key={song._id}
                  song={song}
                  onPress={() => handleSongPress(song)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E12',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A0A0A0',
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  heroTitle: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroContent: {
    position: 'relative',
  },
  heroSongTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSongArtist: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 16,
  },
  heroPlayBtn: {
    position: 'absolute',
    right: 0,
    top: -10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  srsCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  srsGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  srsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  srsCount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  srsSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  songCard: {
    width: 160,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    position: 'relative',
  },
  songCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 2,
  },
  playOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
});