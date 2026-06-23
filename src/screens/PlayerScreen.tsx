import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import TrackPlayer from '@rntp/player';

import { DictionaryModal } from '../components/DictionaryModal';
import { LyricLineUI } from '../components/LyricLineUI';
import { PlayerProgressBar } from '../components/PlayerProgressBar';
import { parseLrcText } from '../utils/lrcParser';
import { useAudioStore } from '../store/audioStore';
import { useFlashcardStore } from '../store/flashcardStore';
import { useAudioSync } from '../hooks/useAudioSync';
import type { Flashcard, LyricLine, LyricToken } from '../types';

// ==========================================
// COMPONENT: Magnetic Focus Lyric Row (Tối ưu 60FPS)
// ==========================================
interface FocusLyricRowProps {
  item: LyricLine;
  index: number;
  activeIndex: number;
  isLearnMode: boolean;
  maskedIndex: number;
  quizAnswered: boolean;
  onTokenPress: (token: LyricToken, line: LyricLine) => void;
  onLineDoubleTap: (line: LyricLine) => void;
  onAddSrs: (line: LyricLine, token: LyricToken) => void;
}

const FocusLyricRow = React.memo(({ 
  item, 
  index,
  activeIndex,
  isLearnMode,
  maskedIndex,
  quizAnswered,
  onTokenPress, 
  onLineDoubleTap, 
  onAddSrs 
}: FocusLyricRowProps) => {
  const isActive = index === activeIndex;
  const isUpcoming = index === activeIndex + 1;

  // Xử lý quiz ẩn từ ngay trong component để tối ưu hóa render
  const displayItem = useMemo(() => {
    if (isLearnMode && isActive && maskedIndex !== -1 && !quizAnswered) {
      return { 
        ...item, 
        tokens: item.tokens.map((t, i) => i === maskedIndex ? { ...t, word: ' ❓ ' } : t) 
      };
    }
    return item;
  }, [item, isLearnMode, isActive, maskedIndex, quizAnswered]);

  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.05, friction: 7, tension: 40, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(indicatorOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      // Dừng các hiệu ứng đang chạy và đưa về trạng thái inactive nhanh để tránh lỗi tái sử dụng view của FlatList
      Animated.parallel([
        Animated.spring(scale, { toValue: 0.9, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: isUpcoming ? 0.6 : 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(indicatorOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive, isUpcoming]);

  return (
    <View style={styles.lyricRowContainer}>
      {/* THANH TRẠNG THÁI BÊN TRÁI */}
      <Animated.View style={[styles.activeIndicator, { opacity: indicatorOpacity }]} />

      {/* NỘI DUNG CHỮ */}
      <Animated.View style={[
          styles.lyricContentWrapper,
          { 
            opacity, 
            transform: [{ scale }],
          }
        ]}
      >
        <LyricLineUI
          line={displayItem}
          isActive={isActive}
          onTokenPress={(token: any) => onTokenPress(token, item)}
          onLineDoubleTap={() => onLineDoubleTap(item)}
        />
        
        {/* Nút SRS được đưa ra dạng absolute cố định bên phải để không dịch chuyển vị trí của chữ */}
        {isActive && item.tokens && item.tokens.length > 0 && (
          <View style={styles.absoluteSrsContainer}>
            <TouchableOpacity style={styles.addSrsBtn} onPress={() => onAddSrs(item, item.tokens[0])}>
              <Text style={styles.addSrsText}>+ SRS</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Chỉ kích hoạt render lại khi có sự thay đổi trạng thái thực sự liên quan đến hàng này
  const wasActive = prevProps.index === prevProps.activeIndex;
  const isNowActive = nextProps.index === nextProps.activeIndex;
  const wasUpcoming = prevProps.index === prevProps.activeIndex + 1;
  const isNowUpcoming = nextProps.index === nextProps.activeIndex + 1;

  return (
    wasActive === isNowActive &&
    wasUpcoming === isNowUpcoming &&
    prevProps.isLearnMode === nextProps.isLearnMode &&
    prevProps.quizAnswered === nextProps.quizAnswered &&
    prevProps.maskedIndex === nextProps.maskedIndex &&
    prevProps.item.lineId === nextProps.item.lineId
  );
});

// ==========================================
// MÀN HÌNH CHÍNH
// ==========================================
export const PlayerScreen = () => {
  useAudioSync();

  const isPlaying = useAudioStore((state) => state.isPlaying);
  const playbackPosition = useAudioStore((state) => state.playbackPosition);
  const currentSong = useAudioStore((state) => state.currentSong);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setLoopInterval = useAudioStore((state) => state.setLoopInterval);
  const addFlashcard = useFlashcardStore((state) => state.setDeck);
  const currentDeck = useFlashcardStore((state) => state.deck);

  const [songLyrics, setSongLyrics] = useState<LyricLine[]>([]);
  const [selectedToken, setSelectedToken] = useState<LyricToken | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLearnMode, setIsLearnMode] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [maskedIndex, setMaskedIndex] = useState(-1);

  const flatListRef = useRef<FlatList>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Animation Xoay Đĩa
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(spinValue, { 
          toValue: 1, 
          duration: 15000, 
          easing: Easing.linear, 
          useNativeDriver: true 
        })
      ).start();
    } else {
      spinValue.stopAnimation();
    }
  }, [isPlaying, spinValue]);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Load Nhạc
  useEffect(() => {
    if (!currentSong) return;
    void (async () => {
      try {
        await TrackPlayer.setMediaItems([{ 
          id: currentSong._id, 
          url: currentSong.audioUrl, 
          title: currentSong.title, 
          artist: currentSong.artist 
        }]);
        let lyrics: LyricLine[] = [];
        if (currentSong.lyrics && currentSong.lyrics.length > 0) {
          lyrics = currentSong.lyrics;
        } else if (currentSong.lrc) {
          lyrics = parseLrcText(currentSong.lrc);
        } else if (currentSong.lrcUrl) {
          const response = await fetch(currentSong.lrcUrl);
          const text = await response.text();
          lyrics = parseLrcText(text);
        }
        setSongLyrics(lyrics);
        await TrackPlayer.play();
      } catch (error) { 
        console.error('[Player] Load song error:', error); 
      }
    })();
  }, [currentSong]);

  // VỊ TRÍ ACTIVE
  const activeIndex = useMemo(() => {
    return songLyrics.findIndex((line) => playbackPosition >= line.startTime && playbackPosition <= line.endTime);
  }, [songLyrics, playbackPosition]);

  // CUỘN TỰ ĐỘNG KHÔNG TRỄ
  useEffect(() => {
    if (activeIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: activeIndex, animated: true, viewPosition: 0.5 });
    }
  }, [activeIndex]);

  // Logic Quiz
  useEffect(() => {
    const activeLine = activeIndex !== -1 ? songLyrics[activeIndex] : null;
    if (!isLearnMode || !activeLine) return;
    const validTokens = activeLine.tokens.filter((t) => t.word.trim().length > 1);
    if (validTokens.length === 0) return;
    setQuizAnswered(false);
    const correctWord = validTokens[Math.floor(Math.random() * validTokens.length)].word;
    const idx = activeLine.tokens.findIndex((t) => t.word === correctWord);
    const distractors = ['世界', '痛んだ', '胸', '僕ら'].filter((w) => w !== correctWord).slice(0, 3);
    setCorrectAnswer(correctWord); 
    setMaskedIndex(idx); 
    setQuizOptions([correctWord, ...distractors].sort(() => Math.random() - 0.5));
    void TrackPlayer.pause(); 
    setIsPlaying(false);
  }, [activeIndex, isLearnMode, setIsPlaying, songLyrics]);

  // Handlers
  const handleTokenPress = useCallback((token: LyricToken, line: LyricLine) => {
    setSelectedToken(token); 
    setModalVisible(true); 
    setLoopInterval({ start: line.startTime, end: line.endTime });
  }, [setLoopInterval]);

  const handleLineDoubleTap = useCallback((line: LyricLine) => { 
    TrackPlayer.seekTo(line.startTime); 
  }, []);

  const handleCloseModal = useCallback(async () => {
    setModalVisible(false); 
    setSelectedToken(null); 
    setLoopInterval(null);
    try { 
      await TrackPlayer.setVolume(1.0); 
    } catch (e) {}
  }, [setLoopInterval]);

  const handleAnswerSelect = useCallback(async (selected: string) => {
    if (selected === correctAnswer) {
      setQuizAnswered(true); 
      await TrackPlayer.play(); 
      setIsPlaying(true); 
      return;
    }
    Alert.alert('Chưa đúng!', 'Nghe kỹ lại nhé.');
    const activeLine = activeIndex !== -1 ? songLyrics[activeIndex] : null;
    if (activeLine) { 
      await TrackPlayer.seekTo(activeLine.startTime); 
      await TrackPlayer.play(); 
      setIsPlaying(true); 
    }
  }, [activeIndex, correctAnswer, setIsPlaying, songLyrics]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) { 
      await TrackPlayer.pause(); 
      setIsPlaying(false); 
      return; 
    }
    await TrackPlayer.play(); 
    setIsPlaying(true);
  }, [isPlaying, setIsPlaying]);

  const handleAddToSRS = useCallback((line: LyricLine, token: LyricToken) => {
    if (!currentSong) return;
    const newCard: Flashcard = {
      _id: `card_${Date.now()}`, 
      word: token.word, 
      reading: token.romaji || token.word, 
      meaning: "Từ vựng bài hát",
      jlptLevel: 'N3', 
      snippetData: { 
        songId: currentSong._id, 
        startTime: line.startTime, 
        endTime: line.endTime, 
        contextSentence: line.tokens.map(i => i.word).join('') 
      },
      srs: { repetition: 0, interval: 1, easeFactor: 2.5, nextReviewDate: new Date().toISOString() },
    };
    addFlashcard([...currentDeck, newCard]);
  }, [addFlashcard, currentDeck, currentSong]);

  const renderItem = useCallback(({ item, index }: { item: LyricLine, index: number }) => {
    return (
      <FocusLyricRow
        item={item}
        index={index}
        activeIndex={activeIndex}
        isLearnMode={isLearnMode}
        maskedIndex={maskedIndex}
        quizAnswered={quizAnswered}
        onTokenPress={handleTokenPress}
        onLineDoubleTap={handleLineDoubleTap}
        onAddSrs={handleAddToSRS}
      />
    );
  }, [activeIndex, isLearnMode, maskedIndex, quizAnswered, handleTokenPress, handleLineDoubleTap, handleAddToSRS]);

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={50} tint="dark" />
      
      {/* KHỐI ALBUM */}
      <View style={styles.albumArtSection}>
        <View style={styles.albumArtWrapper}>
          {currentSong?.coverUrl ? (
            <Animated.Image source={{ uri: currentSong.coverUrl }} style={[styles.albumArtImage, { transform: [{ rotate: spin }] }]} />
          ) : (
            <View style={styles.albumArtPlaceholder} />
          )}
          <View style={styles.albumArtGlow} />
        </View>
        <View style={styles.songInfoContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{currentSong?.title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{currentSong?.artist}</Text>
        </View>
      </View>

      {/* KHỐI LYRICS VÀ ĐIỀU KHIỂN */}
      <View style={styles.contentSection}>
        <FlatList
          ref={flatListRef}
          data={songLyrics}
          keyExtractor={(item, index) => item.lineId || `line-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: 115, offset: 115 * index, index })}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={false}
          style={{ overflow: 'visible' }} 
        />

        {isLearnMode && activeIndex !== -1 && !quizAnswered && quizOptions.length > 0 && (
          <View style={styles.quizContainer}>
            <Text style={styles.quizTitle}>Chọn từ đúng để điền vào ô trống:</Text>
            <View style={styles.optionsRow}>
              {quizOptions.map((o, i) => (
                <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswerSelect(o)}>
                  <Text style={styles.optionText}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.playerControls}>
          <PlayerProgressBar duration={currentSong?.duration || 210} />
          <View style={styles.controlButtonsRow}>
            <TouchableOpacity style={styles.sideControlBtn}><Ionicons name="play-back" size={26} color="#A0A0A0" /></TouchableOpacity>
            
            <TouchableOpacity style={styles.playPauseBtn} onPress={handlePlayPause}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#0A0A0C" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sideControlBtn}><Ionicons name="play-forward" size={26} color="#A0A0A0" /></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.learnBtn, isLearnMode && styles.learnBtnActive]} onPress={() => setIsLearnMode(!isLearnMode)}>
            <Ionicons name={isLearnMode ? "brain" : "school-outline"} size={16} color={isLearnMode ? "#0A0A0C" : "#A0A0A0"} style={{ marginRight: 6 }} />
            <Text style={[styles.learnBtnText, isLearnMode && { color: '#0A0A0C' }]}>{isLearnMode ? 'Chế độ học: BẬT' : 'Học Tập'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DictionaryModal visible={isModalVisible} token={selectedToken} onClose={handleCloseModal} />
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C' },
  
  albumArtSection: { flex: 0.4, justifyContent: 'center', alignItems: 'center' },
  albumArtWrapper: { position: 'relative', width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
  albumArtPlaceholder: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  albumArtImage: { width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  
  songInfoContainer: { alignItems: 'center', marginTop: 20 },
  songTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
  songArtist: { color: '#A0A0A0', fontSize: 16, fontWeight: '500' },
  albumArtGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255, 255, 255, 0.05)', top: -10, left: -10, zIndex: -1 },
  
  contentSection: { flex: 0.6, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 10, overflow: 'hidden' },
  listContent: { paddingHorizontal: 16, paddingVertical: 40 }, 
  
  lyricRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 115, 
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },

  activeIndicator: {
    position: 'absolute',
    left: 10, 
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#1DB954',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  lyricContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    paddingHorizontal: 48, // Khoảng trống an toàn ở 2 lề để không đè vào thanh LED hoặc nút SRS
  },

  absoluteSrsContainer: {
    position: 'absolute',
    right: 12, // Cố định ở góc bên phải
    height: '100%',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  addSrsBtn: { 
    backgroundColor: 'rgba(29, 185, 84, 0.15)', 
    borderWidth: 1, 
    borderColor: '#1DB954', 
    borderRadius: 20, 
    paddingVertical: 6, 
    paddingHorizontal: 12 
  },
  addSrsText: { color: '#1DB954', fontSize: 11, fontWeight: '800' },
  
  playerControls: { backgroundColor: 'rgba(0, 0, 0, 0.4)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 35 },
  controlButtonsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  
  playPauseBtn: { 
    alignItems: 'center', 
    backgroundColor: '#1DB954', 
    borderRadius: 32, 
    height: 64, 
    justifyContent: 'center', 
    marginHorizontal: 24, 
    width: 64,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sideControlBtn: { padding: 12 },
  
  learnBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'center', marginTop: 16 },
  learnBtnActive: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  learnBtnText: { color: '#A0A0A0', fontSize: 13, fontWeight: '700' },
  
  quizContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderTopColor: '#1DB954', borderTopWidth: 2, padding: 20 },
  quizTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  optionsRow: { flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-around' },
  optionBtn: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, margin: 6, minWidth: '42%', paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  optionText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});