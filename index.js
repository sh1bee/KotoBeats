import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerRootComponent } from 'expo';
import TrackPlayer from '@rntp/player';
import { playbackService } from './src/services/playbackService';

AppRegistry.registerComponent(appName, () => App);

registerRootComponent(App);
TrackPlayer.registerPlaybackService(playbackService);