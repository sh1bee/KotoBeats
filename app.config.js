export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
          "targetSdkVersion": 36,
        },
      },
    ],
    './plugins/withTrackPlayerTurboModuleFix',
  ],
});