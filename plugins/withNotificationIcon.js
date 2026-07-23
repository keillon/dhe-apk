const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function upsertMeta(metas, name, resource) {
  const existing = metas.find((item) => item.$?.["android:name"] === name);
  if (existing) {
    existing.$["android:resource"] = resource;
    return;
  }
  metas.push({
    $: {
      "android:name": name,
      "android:resource": resource,
    },
  });
}

function copyNotificationDrawables(projectRoot, platformProjectRoot) {
  const sourceRoot = path.join(projectRoot, "assets", "notification-icons");
  const resRoot = path.join(platformProjectRoot, "app", "src", "main", "res");
  const folders = [
    "drawable",
    "drawable-mdpi",
    "drawable-hdpi",
    "drawable-xhdpi",
    "drawable-xxhdpi",
    "drawable-xxxhdpi",
  ];

  for (const folder of folders) {
    const src = path.join(sourceRoot, folder, "notification_icon.png");
    const fallback = path.join(projectRoot, "assets", "notification-icon.png");
    const from = fs.existsSync(src) ? src : fallback;
    if (!fs.existsSync(from)) continue;

    const destDir = path.join(resRoot, folder);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(from, path.join(destDir, "notification_icon.png"));
  }

  // Remove possíveis ícones padrão do Expo que possam sobrescrever o smallIcon.
  const legacyNames = ["ic_stat_notification.png", "notification_icon_legacy.png"];
  for (const folder of folders) {
    for (const name of legacyNames) {
      const file = path.join(resRoot, folder, name);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}

/**
 * Garante smallIcon DHE em todas as densidades + meta-data FCM/Expo.
 * Nunca deixa o ícone padrão do Android como smallIcon.
 */
function withNotificationIcon(config) {
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      copyNotificationDrawables(config.modRequest.projectRoot, config.modRequest.platformProjectRoot);
      return config;
    },
  ]);

  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    if (!app["meta-data"]) app["meta-data"] = [];

    const metas = app["meta-data"];
    upsertMeta(
      metas,
      "com.google.firebase.messaging.default_notification_icon",
      "@drawable/notification_icon"
    );
    upsertMeta(
      metas,
      "expo.modules.notifications.default_notification_icon",
      "@drawable/notification_icon"
    );
    upsertMeta(
      metas,
      "com.google.firebase.messaging.default_notification_color",
      "@color/notification_icon_color"
    );

    return config;
  });
}

module.exports = withNotificationIcon;
