// ESLint flat config (ESLint 9) using Expo's shared rules.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'android/**', 'ios/**'],
  },
];
