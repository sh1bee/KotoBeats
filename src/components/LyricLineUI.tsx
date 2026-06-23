import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import type { LyricLine, LyricToken } from '../types';

interface Props {
  line: LyricLine;
  isActive: boolean;
  onTokenPress: (token: LyricToken) => void;
  onLineDoubleTap?: (line: LyricLine) => void;
}

const arePropsEqual = (prev: Props, next: Props) => {
  if (prev.isActive !== next.isActive) return false;
  if (prev.line.lineId !== next.line.lineId) return false;
  if (prev.line.startTime !== next.line.startTime) return false;
  if (prev.line.endTime !== next.line.endTime) return false;
  if (prev.line.text !== next.line.text) return false;
  if (prev.line.translation !== next.line.translation) return false;
  if (prev.line.tokens.length !== next.line.tokens.length) return false;
  for (let i = 0; i < prev.line.tokens.length; i++) {
    const prevToken = prev.line.tokens[i];
    const nextToken = next.line.tokens[i];
    if (
      prevToken.word !== nextToken.word ||
      prevToken.base !== nextToken.base ||
      prevToken.romaji !== nextToken.romaji
    ) {
      return false;
    }
  }
  return true;
};

export const LyricLineUI = React.memo(
  ({ line, isActive, onTokenPress, onLineDoubleTap }: Props) => {
    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        onLineDoubleTap?.(line);
      });

    return (
      <GestureDetector gesture={doubleTapGesture}>
        <View style={[styles.lineContainer, isActive && styles.activeLineContainer]}>
          <View style={styles.tokensContainer}>
            {line.tokens.map((token, index) => (
              <TouchableOpacity
                key={`${line.lineId}-${index}`}
                onPress={() => onTokenPress(token)}
                activeOpacity={0.7}
                style={styles.tokenButton}
              >
                <Text style={[styles.tokenText, isActive && styles.activeTokenText]}>
                  {token.word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ĐÃ XOÁ BỎ PHẦN JAPANESE TEXT BỊ LẶP Ở ĐÂY */}

          {/* Vietnamese mini subtitle - below Japanese lyrics */}
          {line.translation ? (
             <Text style={[styles.translationText, isActive && styles.activeTranslation]}>
               {line.translation}
             </Text>
          ) : null}
        </View>
      </GestureDetector>
    );
  },
  arePropsEqual
);

LyricLineUI.displayName = 'LyricLineUI';

const styles = StyleSheet.create({
  lineContainer: {
    marginVertical: 16,
    paddingHorizontal: 20,
    opacity: 0.4,
    backgroundColor: 'transparent', // Đảm bảo trong suốt hoàn toàn
  },
  activeLineContainer: {
    opacity: 1,
  },
  tokensContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tokenButton: {
    alignItems: 'center',
    marginBottom: 4,
    marginRight: 6,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  activeTokenText: {
    color: '#FFFFFF',
  },
  translationText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.8,
  },
  activeTranslation: {
    color: '#1DB954',
    opacity: 1,
  },
});