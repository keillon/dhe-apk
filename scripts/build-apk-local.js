const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";
const gradle = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");

if (!fs.existsSync(gradle)) {
  console.error("Pasta android/ não encontrada. Rode: npm run prebuild:android");
  process.exit(1);
}

const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (isWin
    ? path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk")
    : path.join(process.env.HOME || "", "Android", "Sdk"));

if (androidHome && fs.existsSync(androidHome)) {
  const sdkDir = androidHome.replace(/\\/g, "/");
  fs.writeFileSync(
    path.join(androidDir, "local.properties"),
    `sdk.dir=${sdkDir}\n`,
    "utf8"
  );
}

const gradleUserHome =
  process.env.GRADLE_USER_HOME || (isWin ? "C:\\g" : undefined);

if (gradleUserHome && !fs.existsSync(gradleUserHome)) {
  fs.mkdirSync(gradleUserHome, { recursive: true });
}

const result = spawnSync(gradle, ["assembleRelease", "--no-daemon"], {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWin,
  env: {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    ...(gradleUserHome ? { GRADLE_USER_HOME: gradleUserHome } : {}),
    EXPO_PUBLIC_API_URL:
      process.env.EXPO_PUBLIC_API_URL || "http://195.35.40.86:8090",
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const candidates = [
  path.join(
    androidDir,
    "app",
    "build",
    "outputs",
    "apk",
    "release",
    "app-release.apk"
  ),
  path.join(
    androidDir,
    "app",
    "build",
    "outputs",
    "apk",
    "release",
    "app-release-unsigned.apk"
  ),
];

const apk = candidates.find((file) => fs.existsSync(file));
if (!apk) {
  console.error("Build terminou, mas o APK não foi encontrado em android/app/build/outputs/apk/release/");
  process.exit(1);
}

console.log(`\nAPK gerado:\n${apk}\n`);
