module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Reanimated v4 worklets in Expo SDK 56
      'react-native-worklets/plugin',
    ],
  };
};
