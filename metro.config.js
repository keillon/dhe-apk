const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Windows: polling evita precisar recarregar manualmente após edições.
config.watchFolders = config.watchFolders ?? [];
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => middleware,
};

config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
  },
  watchman: {
    deferStates: ["hg.update"],
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
