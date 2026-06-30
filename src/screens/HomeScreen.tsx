// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { fetchSongsFromFirebase } from '../services/firebase/dbService';
import { useAudioStore } from '../store/audioStore';
import { useFlashcardStore } from '../store/flashcardStore';
import TrackPlayer from '@rntp/player';
import type { Song, Flashcard } from '../types';

import { useSyncFlashcards } from '../hooks/useSyncFlashcards';
import { SRSReviewModal } from '../components/SRSReviewModal';
import { useDueCards } from '../hooks/useDueCards';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

// ========================
// COMPONENT CON
// ========================

const SongGridCard: React.FC<{ song: Song; onPress: () => void }> = ({ song, onPress }) => (
  <TouchableOpacity style={styles.songGridCard} onPress={onPress} activeOpacity={0.7}>
    <LinearGradient
      colors={['#1E1E1E', '#2A2A2A']}
      style={styles.songCardGradient}
    >
      <Ionicons name="musical-notes" size={28} color="#1DB954" />
      <Text style={styles.songGridTitle} numberOfLines={2}>{song.title}</Text>
      <Text style={styles.songGridArtist} numberOfLines={1}>{song.artist}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ========================
// MINI QUESTIONS BOX (đã sửa lỗi logic + TypeScript)
// ========================
interface QuickQuestion {
  card: Flashcard;
  options: string[];
  correctIndex: number;
}

const MiniQuestionsBox: React.FC = () => {
  const deck = useFlashcardStore((state) => state.deck);
  const processSwipe = useFlashcardStore((state) => state.processSwipe);
  const [question, setQuestion] = useState<QuickQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const isLockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQuestion = useCallback(() => {
    if (deck.length < 4) return null;
    const correctCard = deck[Math.floor(Math.random() * deck.length)];
    const others = deck
      .filter(c => c._id !== correctCard._id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [correctCard, ...others]
      .sort(() => Math.random() - 0.5)
      .map(c => c.word);
    const correctIndex = options.findIndex(w => w === correctCard.word);
    return { card: correctCard, options, correctIndex };
  }, [deck]);

  // Tạo câu hỏi lần đầu khi mount và mỗi khi cần reset
  const newQuestion = useCallback(() => {
    const q = generateQuestion();
    setQuestion(q);
    setSelectedAnswer(null);
    setIsCorrect(null);
    isLockedRef.current = false;
  }, [generateQuestion]);

  useEffect(() => {
    newQuestion();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAnswer = (index: number) => {
    if (isLockedRef.current || !question) return;
    isLockedRef.current = true;
    setSelectedAnswer(index);
    const correct = index === question.correctIndex;
    setIsCorrect(correct);

    if (question) {
      processSwipe(question.card._id, correct);
    }

    // Sau 2.5 giây, tạo câu hỏi mới (nếu deck >= 4) hoặc ẩn đi
    timerRef.current = setTimeout(() => {
      if (deck.length >= 4) {
        newQuestion();
      } else {
        setQuestion(null);
        isLockedRef.current = false;
      }
    }, 5000);
  };

  // Nếu không có câu hỏi, không hiển thị gì
  if (!question) return null;

  return (
    <View style={styles.miniQuestionsBox}>
      <LinearGradient
        colors={['#2D1B2E', '#1F1A24']}
        style={styles.miniQuestionsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.miniQuestionsHeader}>
          <Ionicons name="flame" size={20} color="#FF8E53" />
          <Text style={styles.miniQuestionsTitle}>Thử thách nhanh</Text>
          {isCorrect !== null && (
            <Ionicons
              name={isCorrect ? "checkmark-circle" : "close-circle"}
              size={20}
              color={isCorrect ? "#1DB954" : "#FF6B6B"}
            />
          )}
        </View>

        {selectedAnswer === null ? (
          <>
            <Text style={styles.miniQuestionsWord}>
              Nghĩa: {question.card.meaning}
            </Text>
            <Text style={styles.miniQuestionsHint}>
              Chọn từ tiếng Nhật đúng
            </Text>
            <View style={styles.miniQuestionsOptions}>
              {question.options.map((word, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.miniQuestionOption}
                  onPress={() => handleAnswer(idx)}
                  disabled={isLockedRef.current}
                >
                  <Text style={styles.miniQuestionOptionText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.miniQuestionsResult}>
            <Text style={styles.miniQuestionsResultText}>
              {isCorrect ? '🎉 Chính xác!' : `❌ Đáp án: ${question.card.word}`}
            </Text>
            <Text style={styles.miniQuestionsReading}>
              {question.card.reading}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// ========================
// MÀN HÌNH CHÍNH
// ========================
export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const playlist = useAudioStore((state) => state.playlist);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setLoopInterval = useAudioStore((state) => state.setLoopInterval);

  const deck = useFlashcardStore((state) => state.deck);
  const [showSRSModal, setShowSRSModal] = useState(false);
  const dueCardsCount = useDueCards().length;

  const [loading, setLoading] = useState(true);

  useSyncFlashcards();

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

  const displaySongs = useMemo(() => {
    return playlist.slice(0, 10);
  }, [playlist]);

  const handleSongPress = useCallback(
    async (song: Song) => {
      try {
        setLoopInterval(null);
        setCurrentSong(song);

        // Lấy playlist từ store
        let currentPlaylist = useAudioStore.getState().playlist;
        
        // Nếu playlist rỗng, fetch từ Firebase
        if (currentPlaylist.length === 0) {
          const songs = await fetchSongsFromFirebase();
          useAudioStore.getState().setPlaylist(songs);
          currentPlaylist = songs;
        }

        const startIndex = currentPlaylist.findIndex(s => s._id === song._id) || 0;

        // Set toàn bộ playlist vào TrackPlayer
        await TrackPlayer.setMediaItems(
          currentPlaylist.map(s => ({
            mediaId: s._id,
            url: s.audioUrl,
            title: s.title,
            artist: s.artist,
            artwork: s.coverUrl,
          }))
        );
        console.log('📦 TrackPlayer queue set with', currentPlaylist.length, 'items');

        await TrackPlayer.skipToIndex(startIndex);
        await TrackPlayer.play();
        setIsPlaying(true);
        navigation.navigate('Music');
      } catch (error) {
        console.error('[Home] Lỗi khi tải bài hát:', error);
      }
    },
    [setCurrentSong, setIsPlaying, setLoopInterval, navigation]
  );

  const handleSeeAll = () => {
    navigation.navigate('Music');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1A1A2E', '#0E0E12', '#0E0E12']}
      style={styles.container}
      locations={[0, 0.3, 1]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Chào buổi sáng, Đạt!</Text>
          <View style={styles.streakContainer}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.streakText}>Streak: 12 days</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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

        <TouchableOpacity style={styles.srsCard} onPress={() => setShowSRSModal(true)}>
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

        <MiniQuestionsBox />

        <TouchableOpacity style={styles.jlptCard} activeOpacity={0.7}>
          <LinearGradient
            colors={['#9B59B6', '#8E44AD']}
            style={styles.jlptGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="school" size={24} color="#FFFFFF" />
            <Text style={styles.jlptTitle}>Luyện đề JLPT</Text>
            <Text style={styles.jlptSubtitle}>N5 - N1 (Sắp ra mắt)</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thư viện bài hát</Text>
          {displaySongs.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài hát nào</Text>
          ) : (
            <View style={styles.songGrid}>
              {displaySongs.map((song) => (
                <SongGridCard
                  key={song._id}
                  song={song}
                  onPress={() => handleSongPress(song)}
                />
              ))}
            </View>
          )}
          {playlist.length > 10 && (
            <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
              <Text style={styles.seeAllText}>Xem tất cả ({playlist.length} bài)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <SRSReviewModal
        visible={showSRSModal}
        onClose={() => setShowSRSModal(false)}
      />
    </LinearGradient>
  );
};

// ========================
// STYLES (giữ nguyên)
// ========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 20,
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
  miniQuestionsBox: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  miniQuestionsGradient: {
    padding: 20,
    borderRadius: 20,
  },
  miniQuestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  miniQuestionsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  miniQuestionsWord: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  miniQuestionsHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 16,
  },
  miniQuestionsOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniQuestionOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  miniQuestionOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  miniQuestionsResult: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  miniQuestionsResultText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  miniQuestionsReading: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  jlptCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  jlptGradient: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jlptTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  jlptSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
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
  songGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  songGridCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
  },
  songCardGradient: {
    padding: 16,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songGridTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  songGridArtist: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  seeAllButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  seeAllText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
  },
});