import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { TinderCard } from '../components/TinderCard';
import { useAudioStore } from '../store/audioStore';
import { useFlashcardStore } from '../store/flashcardStore';
import { fetchFlashcardsForUser, updateFlashcardSRS } from '../services/firebase/dbService';
import type { Flashcard } from '../types';
import TrackPlayer from '@rntp/player';

const CURRENT_USER_ID = 'demo_user';

export const SRSFlashcardScreen = () => {
  const deck = useFlashcardStore((state) => state.deck);
  const setDeck = useFlashcardStore((state) => state.setDeck);
  const processSwipe = useFlashcardStore((state) => state.processSwipe);
  const setLoopInterval = useAudioStore((state) => state.setLoopInterval);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return () => {
      setLoopInterval(null);
      TrackPlayer.pause();
    };
  }, [setLoopInterval]);

  useEffect(() => {
    const loadFlashcards = async () => {
      setIsLoading(true);
      try {
        const cards = await fetchFlashcardsForUser(CURRENT_USER_ID);
        const dueCards = cards.filter(
          (card) => new Date(card.srs.nextReviewDate) <= new Date()
        );
        setDeck(dueCards.length > 0 ? dueCards : []);
      } catch (error) {
        console.error('[SRS] Failed to load flashcards:', error);
        setDeck([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadFlashcards();
  }, [setDeck]);

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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Đang tải thẻ SRS...</Text>
      </SafeAreaView>
    );
  }

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
                    void updateFlashcardSRS(CURRENT_USER_ID, { ...card, srs: { ...card.srs, repetition: card.srs.repetition + (isRemembered ? 1 : 0) } });
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A0A0A0',
    marginTop: 16,
    fontSize: 16,
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
});