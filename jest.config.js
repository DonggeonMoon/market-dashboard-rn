module.exports = {
  preset: '@react-native/jest-preset',
  // React Navigation 계열 패키지는 ESM(export 문법)으로 배포되어 기본 transformIgnorePatterns에 걸리므로
  // 예외로 추가해 Babel이 변환하도록 한다.
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
