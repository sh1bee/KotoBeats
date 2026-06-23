declare module 'expo-linear-gradient' {
  import { ComponentType, ViewStyle } from 'react';

  interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    style?: ViewStyle;
    children?: React.ReactNode;
  }

  const LinearGradient: ComponentType<LinearGradientProps>;
  export { LinearGradient };
  export default LinearGradient;
}