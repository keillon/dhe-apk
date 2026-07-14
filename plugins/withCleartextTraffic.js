const {
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

/**
 * Garante HTTP cleartext no APK release (necessário para API http://VPS:8090).
 */
function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );
    app.$["android:usesCleartextTraffic"] = "true";
    return config;
  });
}

module.exports = withCleartextTraffic;
