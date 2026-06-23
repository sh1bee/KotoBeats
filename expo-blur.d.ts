declare module 'expo-blur' {
  import { ViewStyle } from 'react-native';
  import { ComponentType } from 'react';

  interface BlurViewProps {
    blurType?: 'light' | 'dark' | 'extraDark';
    blurAmount?: number;
    tint?: 'light' | 'dark';
    style?: ViewStyle;
    children?: React.ReactNode;
  }

  const BlurView: ComponentType<BlurViewProps>;
  export { BlurView };
  export default BlurView;
}