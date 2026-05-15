const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que o bundler reconheça arquivos WebAssembly (.wasm)
// Essencial para o expo-sqlite rodar no navegador
config.resolver.assetExts.push('wasm');

module.exports = config;
