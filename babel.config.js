// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      //'react-native-reanimated/plugin', // Đảm bảo dòng này nằm cuối cùng trong danh sách plugins
    ],
  };
};