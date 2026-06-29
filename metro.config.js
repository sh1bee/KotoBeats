const { getDefaultConfig } = require('expo/metro-config');

// 1. Khởi tạo cấu hình mặc định chuẩn của Expo SDK 56
const config = getDefaultConfig(__dirname);

// 2. Kế thừa và thêm cấu hình extraNodeModules hiện tại của bạn vào
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@react-native-async-storage/async-storage': require.resolve(
    '@react-native-async-storage/async-storage'
  ),
};

config.resolver.assetExts.push('json');

module.exports = config;