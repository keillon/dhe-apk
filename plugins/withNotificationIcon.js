const {
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

/**
 * Garante que o ícone de notificação seja sempre o DHE (nunca o ícone padrão Android).
 */
function withNotificationIcon(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    if (!app["meta-data"]) app["meta-data"] = [];

    const metas = app["meta-data"];

    const upsertMeta = (name, resource) => {
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
    };

    // Ícone pequeno da status bar / tray (branco sobre transparente).
    upsertMeta(
      "com.google.firebase.messaging.default_notification_icon",
      "@drawable/notification_icon"
    );
    upsertMeta(
      "expo.modules.notifications.default_notification_icon",
      "@drawable/notification_icon"
    );
    upsertMeta(
      "com.google.firebase.messaging.default_notification_color",
      "@color/notification_icon_color"
    );

    return config;
  });
}

module.exports = withNotificationIcon;
