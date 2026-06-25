const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Only bundle for native platforms — prevents web bundling errors
config.resolver.platforms = ['ios', 'android', 'native'];

// Exclude web-panel (Next.js) from Metro file watcher
config.resolver.blockList = [/web-panel[/\\].*/];

module.exports = config;
