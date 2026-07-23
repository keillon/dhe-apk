const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";
const gradle = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");
const forceClean = process.argv.includes("--clean");
const skipPrebuild = process.argv.includes("--skip-prebuild");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const needsPrebuild = forceClean || !fs.existsSync(gradle);

if (!skipPrebuild && needsPrebuild) {
  console.log(
    forceClean
      ? "\n→ Prebuild limpo (--clean)...\n"
      : "\n→ Pasta android/ ausente — gerando nativo uma vez...\n"
  );
  run("npx", ["expo", "prebuild", "--platform", "android", ...(forceClean ? ["--clean"] : [])]);
} else if (!fs.existsSync(gradle)) {
  console.error("Pasta android/ não encontrada. Rode: npm run prebuild:android");
  process.exit(1);
} else {
  console.log("\n→ Reusando android/ existente (muito mais rápido). Use --clean se mudou plugins/nativo.\n");
}

const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (isWin
    ? path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk")
    : path.join(process.env.HOME || "", "Android", "Sdk"));

if (androidHome && fs.existsSync(androidHome)) {
  const sdkDir = androidHome.replace(/\\/g, "/");
  fs.writeFileSync(path.join(androidDir, "local.properties"), `sdk.dir=${sdkDir}\n`, "utf8");
}

const gradleUserHome = process.env.GRADLE_USER_HOME || (isWin ? "C:\\g" : undefined);
if (gradleUserHome && !fs.existsSync(gradleUserHome)) {
  fs.mkdirSync(gradleUserHome, { recursive: true });
}

console.log("→ Gradle assembleRelease (daemon + cache + parallel)...\n");

const result = spawnSync(
  gradle,
  ["assembleRelease", "--parallel", "--build-cache", "--configuration-cache"],
  {
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
      ORG_GRADLE_PROJECT_reactNativeArchitectures: "arm64-v8a",
    },
  }
);

if (result.status !== 0) {
  // Fallback sem configuration-cache (Gradle antigo / incompatível)
  console.log("\n→ Retry sem configuration-cache...\n");
  const retry = spawnSync(gradle, ["assembleRelease", "--parallel", "--build-cache"], {
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
      ORG_GRADLE_PROJECT_reactNativeArchitectures: "arm64-v8a",
    },
  });
  if (retry.status !== 0) process.exit(retry.status ?? 1);
}

const candidates = [
  path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk"),
  path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk"),
];

const apk = candidates.find((file) => fs.existsSync(file));
if (!apk) {
  console.error("APK não encontrado em android/app/build/outputs/apk/release/");
  process.exit(1);
}

const desktopApk = path.join(
  process.env.USERPROFILE || process.env.HOME || root,
  "Desktop",
  "DHE-Hidraulicos.apk"
);

try {
  fs.copyFileSync(apk, desktopApk);
  console.log(`\nAPK gerado:\n${apk}\nCopiado para:\n${desktopApk}\n`);
} catch {
  console.log(`\nAPK gerado:\n${apk}\n`);
}
