import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { Flashcard } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Props {
  card: Flashcard;
  onSwiped: (isRemembered: boolean) => void;
}

export const TinderCard = ({ card, onSwiped }: Props) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, {}, () => {
          runOnJS(onSwiped)(true);
        });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {}, () => {
          runOnJS(onSwiped)(false);
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-15, 15]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={styles.jlpt}>{card.jlptLevel}</Text>
        <Text style={styles.word}>{card.word}</Text>
        <Text style={styles.reading}>{card.reading}</Text>
        <Text style={styles.meaning}>{card.meaning}</Text>

        <View style={styles.divider} />

        <Text style={styles.contextLabel}>Ngữ cảnh:</Text>
        <Text style={styles.contextSentence}>{card.snippetData.contextSentence}</Text>

        <View style={styles.instructions}>
          <Text style={styles.instructionLeft}>⬅️ Vuốt trái (Quên)</Text>
          <Text style={styles.instructionRight}>Vuốt phải (Nhớ) ➡️</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '90%',
    height: 450,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  jlpt: {
    position: 'absolute',
    top: 20,
    right: 20,
    color: '#1DB954',
    fontWeight: 'bold',
  },
  word: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  reading: {
    fontSize: 24,
    color: '#1DB954',
    marginBottom: 10,
  },
  meaning: {
    fontSize: 20,
    color: '#B3B3B3',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginVertical: 20,
  },
  contextLabel: {
    color: '#888',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  contextSentence: {
    color: '#FFF',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 20,
  },
  instructionLeft: {
    color: '#FF4D4D',
    fontWeight: 'bold',
  },
  instructionRight: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
});