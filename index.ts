// index.ts
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';
import TrackPlayer from '@rntp/player';
import { playbackService } from './src/services/playbackService';
import App from './App';

// Đăng ký handler cho sự kiện từ background (quan trọng)
TrackPlayer.registerBackgroundEventHandler(() => playbackService);

registerRootComponent(App);