// src/screens/PlayerScreen.tsx
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
import { Ionicons } from '@expo/vector-icons';
import TrackPlayer from '@rntp/player';
import { loadAndPlaySong } from '../services/trackPlayerService';
import { DictionaryModal } from '../components/DictionaryModal';
import { LyricLineUI } from '../components/LyricLineUI';
import { PlayerProgressBar } from '../components/PlayerProgressBar';
import { parseLrcText } from '../utils/lrcParser';
import { useAudioStore } from '../store/audioStore';
import { useFlashcardStore } from '../store/flashcardStore';
import { useAudioSync } from '../hooks/useAudioSync';
import type { Flashcard, LyricLine, LyricToken } from '../types';
import { useTrackChangeListener } from '../hooks/useTrackChangeListener';
import { analyzeLyricLine } from '../services/aiAnalysisService';
import type { LineAnalysis } from '../services/aiAnalysisService';

// ==========================================
// COMPONENT 1: Focus Lyric Row (Tối ưu 60FPS)
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
}: FocusLyricRowProps) => {
  const isActive = index === activeIndex;
  const isUpcoming = index === activeIndex + 1;

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
      Animated.parallel([
        Animated.spring(scale, { toValue: 0.9, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: isUpcoming ? 0.6 : 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(indicatorOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive, isUpcoming]);

  return (
    <View style={styles.lyricRowContainer}>
      <Animated.View style={[styles.activeIndicator, { opacity: indicatorOpacity }]} />

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
      </Animated.View>
    </View>
  );
}, (prevProps, nextProps) => {
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.item !== nextProps.item) return false;
  if (prevProps.item.lineId !== nextProps.item.lineId) return false;

  const wasActive = prevProps.index === prevProps.activeIndex;
  const isNowActive = nextProps.index === nextProps.activeIndex;
  if (wasActive !== isNowActive) return false;

  const wasUpcoming = prevProps.index === prevProps.activeIndex + 1;
  const isNowUpcoming = nextProps.index === nextProps.activeIndex + 1;
  if (wasUpcoming !== isNowUpcoming) return false;

  if (prevProps.isLearnMode !== nextProps.isLearnMode) return false;
  if (prevProps.quizAnswered !== nextProps.quizAnswered) return false;
  if (prevProps.maskedIndex !== nextProps.maskedIndex) return false;

  if (prevProps.onTokenPress !== nextProps.onTokenPress) return false;
  if (prevProps.onLineDoubleTap !== nextProps.onLineDoubleTap) return false;

  return true;
});

// ==========================================
// COMPONENT 2: Isolated Rotating Disk
// ==========================================
interface RotatingCoverProps {
  coverUrl?: string;
  spin: any;
}

const RotatingCover = React.memo(({ coverUrl, spin }: RotatingCoverProps) => {
  return (
    <View style={styles.albumArtWrapper}>
      {coverUrl ? (
        <Animated.Image 
          source={{ uri: coverUrl }} 
          style={[styles.albumArtImage, { transform: [{ rotate: spin }] }]} 
        />
      ) : (
        <View style={styles.albumArtPlaceholder} />
      )}
      <View style={styles.albumArtGlow} />
    </View>
  );
});

RotatingCover.displayName = 'RotatingCover';

// ==========================================
// COMPONENT 3: Isolated Lyric List Section
// ==========================================
interface LyricListSectionProps {
  songLyrics: LyricLine[];
  isLearnMode: boolean;
  maskedIndex: number;
  quizAnswered: boolean;
  onActiveIndexChange: (index: number) => void;
  onTokenPress: (token: LyricToken, line: LyricLine) => void;
  onLineDoubleTap: (line: LyricLine) => void;
}

const LyricListSection = React.memo(({
  songLyrics,
  isLearnMode,
  maskedIndex,
  quizAnswered,
  onActiveIndexChange,
  onTokenPress,
  onLineDoubleTap,
}: LyricListSectionProps) => {
  const playbackPosition = useAudioStore((state) => state.playbackPosition);
  const flatListRef = useRef<FlatList>(null);

  const activeIndex = useMemo(() => {
    return songLyrics.findIndex((line) => playbackPosition >= line.startTime && playbackPosition <= line.endTime);
  }, [songLyrics, playbackPosition]);

  useEffect(() => {
    onActiveIndexChange(activeIndex);
  }, [activeIndex, onActiveIndexChange]);

  useEffect(() => {
    if (activeIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: activeIndex, animated: true, viewPosition: 0.5 });
    }
  }, [activeIndex]);

  const renderItem = useCallback(({ item, index }: { item: LyricLine, index: number }) => {
    return (
      <FocusLyricRow
        item={item}
        index={index}
        activeIndex={activeIndex}
        isLearnMode={isLearnMode}
        maskedIndex={maskedIndex}
        quizAnswered={quizAnswered}
        onTokenPress={onTokenPress}
        onLineDoubleTap={onLineDoubleTap}
      />
    );
  }, [activeIndex, isLearnMode, maskedIndex, quizAnswered, onTokenPress, onLineDoubleTap]);

  return (
    <FlatList
      ref={flatListRef}
      data={songLyrics}
      keyExtractor={(item, index) => item.lineId ? `${item.lineId}-${index}` : `line-${index}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews={true}
      style={{ overflow: 'visible' }} 
      extraData={{ activeIndex, isLearnMode, quizAnswered, maskedIndex }}
      onScrollToIndexFailed={(info) => {   // 👈 Thêm fallback
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
        }, 100);
      }}
    />
  );
}, (prev, next) => {
  return (
    prev.isLearnMode === next.isLearnMode &&
    prev.quizAnswered === next.quizAnswered &&
    prev.maskedIndex === next.maskedIndex &&
    prev.songLyrics === next.songLyrics &&
    prev.onTokenPress === next.onTokenPress &&
    prev.onLineDoubleTap === next.onLineDoubleTap
  );
});

LyricListSection.displayName = 'LyricListSection';

// ==========================================
// MÀN HÌNH CHÍNH (PLAYER SCREEN)
// ==========================================
export const PlayerScreen = () => {
  useAudioSync();
  useTrackChangeListener();
  const isPlaying = useAudioStore((state) => state.isPlaying);
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
  const [lineAnalysis, setLineAnalysis] = useState<LineAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [activeIndex, setActiveIndex] = useState(-1);

  const spinValue = useRef(new Animated.Value(0)).current;

  const [lrcTranslation, setLrcTranslation] = useState('');const setIgnoreStateChange = useAudioStore((state) => state.setIgnoreStateChange);

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
    let cancelled = false;

    const load = async () => {
      try {
        const playlist = useAudioStore.getState().playlist;
        const startIndex = playlist.findIndex(s => s._id === currentSong._id);

        if (startIndex !== -1 && playlist.length > 0) {
          await loadAndPlaySong(playlist, startIndex);
        } else {
          await loadAndPlaySong([currentSong], 0);
        }

        let lyrics: LyricLine[] = [];
        if (currentSong.lyrics?.length) {
          lyrics = currentSong.lyrics;
        } else if (currentSong.lrc) {
          lyrics = parseLrcText(currentSong.lrc);
        } else if (currentSong.lrcUrl) {
          try {
            const response = await fetch(currentSong.lrcUrl);
            const text = await response.text();
            lyrics = parseLrcText(text);
          } catch (err) {
            console.error('Fetch LRC error:', err);
          }
        }

        if (!cancelled) {
          setSongLyrics(lyrics);
        }
      } catch (error) {
        console.error('[Player] Load song error:', error);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [currentSong]);

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
  const handleActiveIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleTokenPress = useCallback((token: LyricToken, line: LyricLine) => {
    setSelectedToken(token);
    setModalVisible(true);
    setLineAnalysis(null);
    setIsAnalyzing(true);

    setLrcTranslation(line.translation || '');

    const lineText = line.tokens.map(t => t.word).join('');
    console.log('🔎 Phân tích dòng:', lineText);

    analyzeLyricLine(lineText, token.word)
      .then((result) => {
        console.log('✅ AI trả về:', JSON.stringify(result));
        setLineAnalysis(result);
      })
      .catch(err => {
        console.error('❌ AI analysis error:', err);
        Alert.alert('Lỗi', `Không thể phân tích: ${err.message}`);
      })
      .finally(() => setIsAnalyzing(false));
  }, []);

  const handleLineDoubleTap = useCallback((line: LyricLine) => {
    setIgnoreStateChange(true);
    TrackPlayer.seekTo(line.startTime);
    setTimeout(() => setIgnoreStateChange(false), 800);
  }, [setIgnoreStateChange]);

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
    try {
      const currentPlaying = useAudioStore.getState().isPlaying;
      if (currentPlaying) {
        await TrackPlayer.pause();
        setIsPlaying(false);  // ✅ cập nhật thủ công vì sự kiện paused không bao giờ tới
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);   // ✅ cập nhật thủ công (phòng khi sự kiện ready cũng không tới ngay)
      }
    } catch (e) {
      console.error('PlayPause error:', e);
    }
  }, [setIsPlaying]);

  const handleAddWordToSRS = useCallback((wordData: WordBreakdownItem) => {
    if (!currentSong || !lineAnalysis) return;
    const newCard: Flashcard = {
      _id: `card_${Date.now()}`,
      word: wordData.word,
      reading: wordData.reading,
      meaning: wordData.meaningVi,
      jlptLevel: wordData.jlptLevel || 'N3',
      snippetData: {
        songId: currentSong._id,
        startTime: 0,
        endTime: 0,
        contextSentence: lineAnalysis.fullLine,
      },
      srs: { repetition: 0, interval: 1, easeFactor: 2.5, nextReviewDate: new Date().toISOString() },
    };
    useFlashcardStore.getState().addCard(newCard); // ✅ dùng store action
  }, [currentSong, lineAnalysis]);

  const handleAddAllWordsToSRS = useCallback(() => {
    if (!lineAnalysis || !currentSong) return;
    lineAnalysis.wordBreakdown.forEach((wordData) => {
      handleAddWordToSRS(wordData); // sử dụng hàm đã có
    });
  }, [lineAnalysis, currentSong, handleAddWordToSRS]);

  type WordBreakdownItem = {
    word: string;
    reading: string;
    meaningVi: string;
    jlptLevel?: string;
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D0D10' }]} />
      
      <View style={styles.albumArtSection}>
        <RotatingCover coverUrl={currentSong?.coverUrl} spin={spin} />
        <View style={styles.songInfoContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{currentSong?.title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{currentSong?.artist}</Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <LyricListSection
          songLyrics={songLyrics}
          isLearnMode={isLearnMode}
          maskedIndex={maskedIndex}
          quizAnswered={quizAnswered}
          onActiveIndexChange={handleActiveIndexChange}
          onTokenPress={handleTokenPress}
          onLineDoubleTap={handleLineDoubleTap}
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
            <TouchableOpacity 
              style={styles.sideControlBtn} 
              onPress={async () => {
                try {
                  await TrackPlayer.skipToPrevious();
                } catch (e) {
                  console.error('Previous error:', e);
                }
              }}
            >
              <Ionicons name="play-back" size={26} color="#A0A0A0" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playPauseBtn} onPress={handlePlayPause}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#0A0A0C" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sideControlBtn} 
              onPress={async () => {
                try {
                  await TrackPlayer.skipToNext();
                } catch (e) {
                  console.error('Next error:', e);
                }
              }}
            >
              <Ionicons name="play-forward" size={26} color="#A0A0A0" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.learnBtn, isLearnMode && styles.learnBtnActive]} onPress={() => setIsLearnMode(!isLearnMode)}>
            <Ionicons name={isLearnMode ? "bulb" : "school-outline"} size={16} color={isLearnMode ? "#0A0A0C" : "#A0A0A0"} style={{ marginRight: 6 }} />
            <Text style={[styles.learnBtnText, isLearnMode && { color: '#0A0A0C' }]}>{isLearnMode ? 'Chế độ học: BẬT' : 'Học Tập'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DictionaryModal
        visible={isModalVisible}
        token={selectedToken}
        onClose={handleCloseModal}
        lineAnalysis={lineAnalysis}
        isAnalyzing={isAnalyzing}
        lrcTranslation={lrcTranslation} 
        onAddWordToSRS={handleAddWordToSRS}
        onAddAllWordsToSRS={handleAddAllWordsToSRS}
      />
    </View>
  );
};

// ==========================================
// STYLES (giữ nguyên như cũ)
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
    minHeight: 115, 
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
    paddingHorizontal: 48,
  },

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