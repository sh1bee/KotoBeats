declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

  type IconName = string;

  interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    style?: ViewStyle | TextStyle | ImageStyle;
  }

  const Ionicons: ComponentType<IconProps>;
  const FontAwesome: ComponentType<IconProps>;
  const MaterialIcons: ComponentType<IconProps>;
  const Feather: ComponentType<IconProps>;

  export { Ionicons, FontAwesome, MaterialIcons, Feather };
}