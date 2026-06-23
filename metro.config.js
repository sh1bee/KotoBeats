const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['web', 'ios', 'android', 'native'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@rntp/player') {
    if (platform === 'web') {
      return {
        filePath: path.resolve(__dirname, '@rntp/player.web.ts'),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, '@rntp/player', platform);
  }
  if (moduleName === 'react-native-safe-area-context') {
    return {
      filePath: path.resolve(__dirname, 'react-native-safe-area-context.web.tsx'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
