// src/components/DictionaryModal.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { LineAnalysis } from '../services/aiAnalysisService';
import { ExerciseHub } from './exercises/ExerciseHub';
import { getKanjiInfo, containsKanji } from '../services/kanjiService';
// ========================
// PALETTE MÀU SÁNG
// ========================
const PHRASE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347',
  '#B39DDB', '#81D4FA', '#F8BBD0', '#FFD54F', '#AED581',
];

// ========================
// PROPS
// ========================
interface DictionaryModalProps {
  visible: boolean;
  token: any;
  onClose: () => void;
  lineAnalysis?: LineAnalysis | null;
  isAnalyzing?: boolean;
  lrcTranslation?: string;
  onAddWordToSRS?: (wordData: {
    word: string;
    reading: string;
    meaningVi: string;
    jlptLevel?: string;
  }) => void;
  onAddAllWordsToSRS?: () => void;
}

// ========================
// COMPONENT CON
// ========================
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// ========================
// ITEM TỪ VỰNG (CÓ ANIMATION VUỐT)
// ========================
const SwipeableVocabItem = React.memo(
  ({
    wordData,
    onAdd,
    isAdded,
  }: {
    wordData: any;
    onAdd?: (w: any) => void;
    isAdded: boolean;
  }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [added, setAdded] = useState(isAdded);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      setAdded(isAdded);
    }, [isAdded]);

    const onGestureEvent = useCallback(
      Animated.event(
        [{ nativeEvent: { translationX: translateX } }],
        { useNativeDriver: true }
      ),
      []
    );

    const onHandlerStateChange = useCallback(
      ({ nativeEvent }: any) => {
        if (isAnimating || added) return;

        if (nativeEvent.state === State.END) {
          if (nativeEvent.translationX < -80) {
            setIsAnimating(true);
            Animated.timing(translateX, {
              toValue: -500,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              if (onAdd) onAdd(wordData);
              setAdded(true);
              translateX.setValue(0);
              setIsAnimating(false);
            });
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        }
      },
      [added, isAnimating, translateX, wordData, onAdd]
    );

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-10, 10]}
        enabled={!added && !isAnimating}
      >
        <Animated.View
          style={[
            styles.vocabItem,
            added && styles.vocabItemAdded,
            { transform: [{ translateX }] },
          ]}
        >
          <View style={styles.vocabContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.vocabWord}>{wordData.word}</Text>
              {wordData.jlptLevel && <Text style={styles.jlptBadge}>{wordData.jlptLevel}</Text>}
            </View>
            <Text style={styles.vocabReading}>{wordData.reading}</Text>
            <Text style={styles.vocabMeaning}>{wordData.meaningVi}</Text>
          </View>
          {added && (
            <View style={styles.addedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    );
  }
);

// ========================
// COMPONENT CHÍNH
// ========================
export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  visible,
  onClose,
  lineAnalysis,
  isAnalyzing,
  onAddWordToSRS,
  onAddAllWordsToSRS,
  lrcTranslation,
  token,
}) => {
  const aligned = lineAnalysis?.alignedTranslation;
  const [allAdded, setAllAdded] = useState(false);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [showExercise, setShowExercise] = useState(false);
  const [kanjiList, setKanjiList] = useState<any[]>([]);

  

  const handleAddWord = (wordData: any) => {
    if (onAddWordToSRS) {
      onAddWordToSRS(wordData);
      setAddedWords((prev) => new Set(prev).add(wordData.word));
    }
  };

  const handleLearnAll = () => {
    if (allAdded) return;
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    if (onAddAllWordsToSRS) {
      onAddAllWordsToSRS();
      const all = new Set<string>();
      lineAnalysis?.wordBreakdown.forEach((w) => all.add(w.word));
      setAddedWords(all);
      setAllAdded(true);
    }
  };

  useEffect(() => {
    if (visible) {
      setAllAdded(false);
      setAddedWords(new Set());
    }
  }, [visible]);

  const renderColoredLine = () => {
    const aligned = lineAnalysis?.alignedTranslation;
    if (!Array.isArray(aligned) || aligned.length === 0) {
      return <Text style={styles.fullLine}>{lineAnalysis?.fullLine}</Text>;
    }
    return (
      <View style={styles.fullLineContainer}>
        {aligned.map((pair, idx) => {
          const color = PHRASE_COLORS[idx % PHRASE_COLORS.length];
          return (
            <Text key={idx} style={[styles.jaPhrase, { color, backgroundColor: color + '20' }]}>
              {pair.ja}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderColoredVietsub = () => {
    const aligned = lineAnalysis?.alignedTranslation;
    if (!Array.isArray(aligned) || aligned.length === 0) {
      return <Text style={styles.vietsubText}>{lineAnalysis?.translation}</Text>;
    }
    return (
      <View style={styles.vietsubContainer}>
        {aligned.map((pair, idx) => {
          const color = PHRASE_COLORS[idx % PHRASE_COLORS.length];
          return (
            <Text key={idx} style={[styles.vietsubPhrase, { color, textDecorationLine: 'underline' }]}>
              {pair.vi}{' '}
            </Text>
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    if (token && containsKanji(token.word)) {
      const kanjis: any[] = [];
      for (const char of token.word) {
        if (/[\u4e00-\u9faf]/.test(char)) {
          const info = getKanjiInfo(char);
          if (info) kanjis.push(info);
        }
      }
      setKanjiList(kanjis);
    } else {
      setKanjiList([]);
    }
  }, [token]);

  // Nếu đang trong chế độ luyện tập, hiển thị ExerciseHub
  if (showExercise && lineAnalysis) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <ExerciseHub
          lineAnalysis={lineAnalysis}
          onBack={() => setShowExercise(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <GestureHandlerRootView style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Phân tích</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 30 }}>
            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#1DB954" style={{ marginVertical: 20 }} />
            ) : lineAnalysis ? (
              <>
                <View style={styles.mainLineWrapper}>
                  {renderColoredLine()}
                  {renderColoredVietsub()}
                  {lrcTranslation ? (
                    <Text style={styles.lrcTranslationText}>{lrcTranslation}</Text>
                  ) : null}
                </View>

                {Array.isArray(aligned) && aligned.length > 0 && (
                  <Section title="Dịch từng câu">
                    <View style={styles.alignedContainer}>
                      {aligned.map((pair, idx) => {
                        const color = PHRASE_COLORS[idx % PHRASE_COLORS.length];
                        return (
                          <View key={idx} style={styles.phraseRow}>
                            <Text style={[styles.jaText, { color }]}>{pair.ja}</Text>
                            <Text style={[styles.viText, { color, textDecorationLine: 'underline' }]}>
                              ({pair.vi})
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </Section>
                )}

                {lineAnalysis.grammarPoints?.length > 0 && (
                  <Section title="Ngữ pháp">
                    {lineAnalysis.grammarPoints.map((p, i) => (
                      <Text key={i} style={styles.bullet}>• {p}</Text>
                    ))}
                  </Section>
                )}

                {Array.isArray(lineAnalysis.wordBreakdown) && lineAnalysis.wordBreakdown.length > 0 && (
                  <Section title="Từ vựng trong câu">
                    {lineAnalysis.wordBreakdown.map((w, i) => (
                      <SwipeableVocabItem key={i} wordData={w} onAdd={handleAddWord} isAdded={addedWords.has(w.word)} />
                    ))}
                  </Section>
                )}

                {kanjiList.length > 0 && (
                  <Section title="Chi tiết Kanji">
                    {kanjiList.map((kanji, idx) => (
                      <View key={idx} style={styles.kanjiCard}>
                        <Text style={styles.kanjiChar}>{kanji.kanji}</Text>
                        <View style={styles.kanjiDetails}>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>Kunyomi: </Text>
                            {kanji.kunyomi?.join(', ') || 'Không có'}
                          </Text>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>Onyomi: </Text>
                            {kanji.onyomi?.join(', ') || 'Không có'}
                          </Text>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>Số nét: </Text>
                            {kanji.strokes}
                          </Text>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>JLPT: </Text>
                            N{kanji.jlpt || '?'}
                          </Text>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>Tần suất: </Text>
                            {kanji.freq ? `${kanji.freq}/2500` : 'Không rõ'}
                          </Text>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>Ý nghĩa: </Text>
                            {kanji.meaningsVi?.join(', ') || 'Không có'}
                          </Text>
                          <Text style={styles.kanjiText}>
                            <Text style={styles.kanjiLabel}>Thành phần: </Text>
                            {kanji.components?.join('; ') || 'Không có'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </Section>
                )}


                {lineAnalysis.notes ? (
                  <Section title="Ghi chú">
                    <Text style={styles.text}>{lineAnalysis.notes}</Text>
                  </Section>
                ) : null}

                {/* Nút Luyện tập */}
                {lineAnalysis && (
                  <TouchableOpacity
                    style={styles.exerciseButton}
                    onPress={() => setShowExercise(true)}
                  >
                    <Ionicons name="fitness" size={20} color="#0A0A0C" style={{ marginRight: 8 }} />
                    <Text style={styles.exerciseButtonText}>Luyện tập</Text>
                  </TouchableOpacity>
                )}

                {/* Nút Học hết */}
                {onAddAllWordsToSRS && (
                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={[styles.learnAllButton, allAdded && styles.learnAllButtonDone]}
                      onPress={handleLearnAll}
                      disabled={allAdded}
                    >
                      <Ionicons
                        name={allAdded ? "checkmark-done" : "download"}
                        size={20}
                        color="#0A0A0C"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.learnAllText}>
                        {allAdded ? 'Đã thêm tất cả' : 'Học hết'}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </>
            ) : (
              <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 20 }}>
                Không thể tải phân tích.
              </Text>
            )}
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ========================
// STYLES
// ========================
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  body: { padding: 16 },

  mainLineWrapper: { marginBottom: 24, alignItems: 'center' },
  fullLineContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  jaPhrase: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 2,
    marginBottom: 4,
  },
  fullLine: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 30,
  },
  vietsubContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  vietsubPhrase: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  vietsubText: {
    color: '#A8E6CF',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  lrcTranslationText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
    lineHeight: 20,
  },

  section: { marginBottom: 16 },
  sectionTitle: { color: '#1DB954', fontWeight: '700', marginBottom: 6, fontSize: 16 },
  text: { color: '#DDD', lineHeight: 22 },
  bullet: { color: '#DDD', marginLeft: 8, marginBottom: 4, lineHeight: 20 },

  alignedContainer: { marginBottom: 8 },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  jaText: { fontSize: 16, fontWeight: '600' },
  viText: { fontSize: 14, fontStyle: 'italic', marginLeft: 2 },

  vocabItem: {
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vocabItemAdded: { backgroundColor: 'rgba(29, 185, 84, 0.2)' },
  vocabContent: { flex: 1 },
  vocabWord: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  vocabReading: { color: '#AAA', fontSize: 13, marginTop: 2 },
  vocabMeaning: { color: '#CCC', fontSize: 14, marginTop: 4 },
  jlptBadge: {
    backgroundColor: '#1DB954',
    color: '#000',
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  addedIndicator: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Nút Luyện tập
  exerciseButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD54F',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  exerciseButtonText: { color: '#0A0A0C', fontWeight: '700', fontSize: 16 },

  // Nút Học hết
  learnAllButton: {
    flexDirection: 'row',
    backgroundColor: '#1DB954',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  learnAllButtonDone: { backgroundColor: '#2E7D32' },
  learnAllText: { color: '#0A0A0C', fontWeight: '700', fontSize: 16 },
    kanjiCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kanjiChar: {
    fontSize: 48,
    color: '#1DB954',
    fontWeight: 'bold',
    marginRight: 20,
    width: 60,
    textAlign: 'center',
  },
  kanjiDetails: {
    flex: 1,
  },
  kanjiText: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  kanjiLabel: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
});