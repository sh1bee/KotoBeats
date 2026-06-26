// src/components/TinderCard.tsx
import React, { useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Flashcard } from '../types'; // Đảm bảo đường dẫn này đúng với project của bạn

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Props {
  card: Flashcard;
  onSwiped: (isRemembered: boolean) => void;
  stackIndex?: number;
  isActive?: boolean;
}

export const TinderCard = ({ card, onSwiped, stackIndex = 0, isActive = true }: Props) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    outputRange: ['-15deg', '15deg'],
  });

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((event) => {
      translateX.setValue(event.translationX);
      translateY.setValue(event.translationY);
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH * 1.5,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onSwiped(true));
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        Animated.timing(translateX, {
          toValue: -SCREEN_WIDTH * 1.5,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onSwiped(false));
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });

  // Đã xóa biến opacity gây lỗi nhìn xuyên thấu
  const scale = 1 - stackIndex * 0.08;
  const translateYOffset = stackIndex * 15;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX },
              { translateY },
              { rotate },
              { scale },
              { translateY: translateYOffset },
            ],
            // Dùng số âm cho zIndex để thẻ sau luôn nằm dưới thẻ trước một cách chính xác
            zIndex: -stackIndex,
          },
        ]}
        pointerEvents={isActive ? 'auto' : 'none'}
      >
        {/* Nhãn JLPT được bọc trong Container để tạo hiệu ứng Badge */}
        <View style={styles.jlptContainer}>
          <Text style={styles.jlpt}>{card.jlptLevel}</Text>
        </View>

        <Text style={styles.word}>{card.word}</Text>
        <Text style={styles.reading}>{card.reading}</Text>
        <Text style={styles.meaning}>{card.meaning}</Text>

        <View style={styles.divider} />

        {/* Cụm ví dụ được bọc lại để căn lề chuẩn xác hơn */}
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Ví dụ:</Text>
          <Text style={styles.contextSentence}>{card.snippetData.contextSentence}</Text>
        </View>

        {isActive && (
          <View style={styles.instructions}>
            <Text style={styles.instructionLeft}>⬅️ Quên</Text>
            <Text style={styles.instructionRight}>Nhớ ➡️</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: width * 0.85, // Nhỏ lại một chút để chừa lề hai bên nhìn sang hơn
    height: 480, // Tăng thêm chút chiều cao cho thoáng
    backgroundColor: '#1E222A', // Xám xanh than, không dùng đen tuyền
    borderRadius: 24, // Bo góc tròn hơn (Trend UI 2024+)
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
    // Đổ bóng (Shadow) tạo cảm giác thẻ nổi 3D mượt mà
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1.5,
    borderColor: '#2A2F3A', // Viền sáng hơn nền một chút để tách biệt không gian
  },
  
  // Hiệu ứng "Pill Badge" cho cấp độ JLPT
  jlptContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(52, 211, 153, 0.15)', // Nền xanh lá trong suốt
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  jlpt: {
    color: '#34D399', // Xanh Emerald
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1, // Kéo giãn chữ tạo vẻ tinh tế
  },

  word: {
    fontSize: 72, // To hơn để tạo điểm nhấn mạnh nhất
    fontWeight: '900',
    color: '#F9FAFB', // Trắng ngà, dịu mắt
    marginBottom: 8,
    letterSpacing: 2, // Thêm khoảng cách giữa các Kanji
  },
  reading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#818CF8', // Chuyển sang Indigo để tách biệt với màu JLPT/Swipe
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  meaning: {
    fontSize: 22,
    fontWeight: '500',
    color: '#D1D5DB', // Xám sáng
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  divider: {
    height: 1.5,
    backgroundColor: '#374151',
    width: '60%', // Không cho dài full viền, nhìn sẽ thanh lịch hơn
    marginVertical: 24,
    borderRadius: 2, // Bo tròn nhẹ hai đầu dòng kẻ
  },

  // Gom nhóm phần ví dụ để dễ căn lề
  contextContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  contextLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase', // Viết hoa chữ "Ví dụ"
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  contextSentence: {
    color: '#E5E7EB',
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26, // Tăng khoảng cách dòng để dễ đọc hơn
  },

  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 24,
    paddingHorizontal: 32,
  },
  instructionLeft: {
    color: '#F87171', // Đỏ san hô
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  instructionRight: {
    color: '#34D399', // Xanh Emerald
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});