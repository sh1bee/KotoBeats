import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { TinderCard } from '../components/TinderCard';
import { useAudioStore } from '../store/audioStore';
import { useFlashcardStore } from '../store/flashcardStore';
import type { Flashcard } from '../types';
import TrackPlayer from '@rntp/player';

const mockDeck: Flashcard[] = [
  {
    _id: 'card_01',
    word: '世界',
    reading: 'せかい',
    meaning: 'Thế giới',
    jlptLevel: 'N4',
    snippetData: {
      songId: 'song_test',
      startTime: 19.65,
      endTime: 24.5,
      contextSentence: '出来れば世界を僕は塗り変えたい',
    },
    srs: {
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: '2026-06-21T00:00:00Z',
    },
  },
  {
    _id: 'card_02',
    word: '戦争',
    reading: 'せんそう',
    meaning: 'Chiến tranh',
    jlptLevel: 'N3',
    snippetData: {
      songId: 'song_test',
      startTime: 26.0,
      endTime: 31.0,
      contextSentence: '戦争をなくすような大逸れたことじゃない',
    },
    srs: {
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: '2026-06-21T00:00:00Z',
    },
  },
];

export const SRSFlashcardScreen = () => {
  const deck = useFlashcardStore((state) => state.deck);
  const setDeck = useFlashcardStore((state) => state.setDeck);
  const processSwipe = useFlashcardStore((state) => state.processSwipe);
  const setLoopInterval = useAudioStore((state) => state.setLoopInterval);

  useEffect(() => {
    setDeck(mockDeck);

    return () => {
      setLoopInterval(null);
      TrackPlayer.pause();
    };
  }, [setDeck, setLoopInterval]);

  useEffect(() => {
    const topCard = deck[0];

    if (topCard) {
      const { startTime, endTime } = topCard.snippetData;
      const playSnippet = async () => {
        setLoopInterval({ start: startTime, end: endTime });
        TrackPlayer.setVolume(1.0);
        TrackPlayer.seekTo(startTime);
        TrackPlayer.play();
      };

      void playSnippet();
      return;
    }

    TrackPlayer.pause();
  }, [deck, setLoopInterval]);

  const loadMockDeck = () => {
    setDeck(mockDeck);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="school" size={24} color="#1DB954" />
        <Text style={styles.headerTitle}>Hệ Thống Ôn Tập SRS</Text>
      </View>
      <Text style={styles.counter}>Số thẻ cần học hôm nay: {deck.length}</Text>

      <View style={styles.cardContainer}>
        {deck.length === 0 ? (
          <View style={styles.doneWrapper}>
            <Ionicons name="trophy" size={64} color="#FFD700" style={{ marginBottom: 16 }} />
            <Text style={styles.doneText}>Bạn đã hoàn thành bài ôn tập hôm nay!</Text>
            <Text style={styles.subDoneText}>
              Hệ thống Spaced Repetition sẽ hẹn lịch các thẻ tiếp theo cho bạn.
            </Text>

            <TouchableOpacity style={styles.reloadBtn} onPress={loadMockDeck}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.reloadBtnText}>Luyện tập lại bài học</Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...deck].reverse().map((card, index) => {
            const isTopCard = index === deck.length - 1;

            return (
              <View
                key={card._id}
                style={StyleSheet.absoluteFill}
                pointerEvents={isTopCard ? 'auto' : 'none'}
              >
                <TinderCard
                  card={card}
                  onSwiped={(isRemembered) => {
                    processSwipe(card._id, isRemembered);
                  }}
                />
              </View>
            );
          })
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E12',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  counter: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  doneWrapper: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  trophyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  doneText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subDoneText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  reloadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
