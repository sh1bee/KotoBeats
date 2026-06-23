import React from 'react';
import { View, ViewStyle } from 'react-native';

interface BlurViewProps {
  blurType?: 'light' | 'dark' | 'extraDark';
  blurAmount?: number;
  tint?: 'light' | 'dark';
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const BlurView = ({ style, children }: BlurViewProps) => {
  return <View style={[{ backgroundColor: 'rgba(18, 18, 18, 0.8)' }, style]}>{children}</View>;
};