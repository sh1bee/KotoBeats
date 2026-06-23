import React from 'react';
import { View, ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const LinearGradient = ({ colors, style, children }: LinearGradientProps) => {
  return (
    <View style={[{ backgroundColor: colors[0] ?? '#1DB954' }, style]}>
      {children}
    </View>
  );
};