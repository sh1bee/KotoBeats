// src/components/SRSReviewModal.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // THÊM
import { TinderCard } from './TinderCard';
import { useFlashcardStore } from '../store/flashcardStore';
import type { Flashcard } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SRSReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SRSReviewModal: React.FC<SRSReviewModalProps> = ({ visible, onClose }) => {
  const deck = useFlashcardStore((state) => state.deck);
  const processSwipe = useFlashcardStore((state) => state.processSwipe);

  const dueCards = useMemo(() => {
    const now = new Date();
    return deck.filter((card) => new Date(card.srs.nextReviewDate) <= now);
  }, [deck]);

  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    if (visible) setCurrentIndex(0);
  }, [visible, dueCards.length]);

  const handleSwiped = useCallback(
    (card: Flashcard, isRemembered: boolean) => {
      processSwipe(card._id, isRemembered);
      setCurrentIndex((prev) => prev + 1);
    },
    [processSwipe]
  );

  const cardsToShow = useMemo(() => {
    return dueCards.slice(currentIndex, currentIndex + 3);
  }, [dueCards, currentIndex]);

  const completed = currentIndex >= dueCards.length && dueCards.length > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      {/* BỌC GestureHandlerRootView */}
      <GestureHandlerRootView style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Ôn tập SRS</Text>
            <Text style={styles.progress}>
              {completed ? dueCards.length : currentIndex}/{dueCards.length}
            </Text>
          </View>

          {/* Khu vực thẻ */}
          <View style={styles.cardContainer}>
            {completed ? (
              <View style={styles.completedContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#1DB954" />
                <Text style={styles.completedText}>Hoàn thành!</Text>
                <Text style={styles.completedSubtext}>
                  Bạn đã ôn xong {dueCards.length} thẻ
                </Text>
                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                  <Text style={styles.doneButtonText}>Quay về</Text>
                </TouchableOpacity>
              </View>
            ) : dueCards.length === 0 ? (
              <View style={styles.completedContainer}>
                <Ionicons name="book" size={80} color="#555" />
                <Text style={styles.completedText}>Không có thẻ nào</Text>
                <Text style={styles.completedSubtext}>
                  Thêm từ vựng để bắt đầu ôn tập
                </Text>
                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                  <Text style={styles.doneButtonText}>Quay về</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cardsToShow.map((card, index) => {
                const isTop = index === cardsToShow.length - 1;
                return (
                  <TinderCard
                    key={card._id}
                    card={card}
                    onSwiped={(isRemembered) => handleSwiped(card, isRemembered)}
                    stackIndex={cardsToShow.length - 1 - index} // 2,1,0
                    isActive={isTop}
                  />
                );
              })
            )}
          </View>

          {/* Hướng dẫn */}
          {!completed && dueCards.length > 0 && (
            <View style={styles.instructionBar}>
              <View style={styles.instructionItem}>
                <Ionicons name="arrow-back" size={20} color="#FF4D4D" />
                <Text style={[styles.instructionText, { color: '#FF4D4D' }]}>Quên</Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={[styles.instructionText, { color: '#1DB954' }]}>Nhớ</Text>
                <Ionicons name="arrow-forward" size={20} color="#1DB954" />
              </View>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// styles giữ nguyên, bổ sung thay đổi nhỏ nếu cần
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progress: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 20,
  },
  completedText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  completedSubtext: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 30,
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  doneButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '700',
  },
});