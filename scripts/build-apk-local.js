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
    cwd: options.cwd || root,
    stdio: "inherit",
    shell: isWin,
    env: options.env || process.env,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function tryRm(target) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
    return true;
  } catch {
    return false;
  }
}

function stopGradleDaemons() {
  if (!fs.existsSync(gradle)) return;
  console.log("→ Parando daemons Gradle (evita arquivo travado no Windows)...\n");
  spawnSync(gradle, ["--stop"], {
    cwd: androidDir,
    stdio: "inherit",
    shell: isWin,
  });
}

function clearLockedNativeBuilds() {
  const targets = [
    path.join(root, "node_modules", "expo-modules-core", "android", "build"),
    path.join(root, "node_modules", "expo-updates", "android", "build"),
    path.join(root, "node_modules", "expo", "android", "build"),
    path.join(androidDir, ".gradle"),
    path.join(androidDir, "build"),
    path.join(androidDir, "app", "build"),
  ];

  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    const ok = tryRm(target);
    console.log(ok ? `  limpou ${path.relative(root, target)}` : `  avisou: não limpou ${path.relative(root, target)}`);
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
  console.log(
    "\n→ Reusando android/ existente (mais rápido). Use --clean se mudou plugins/nativo.\n"
  );
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

stopGradleDaemons();
console.log("→ Limpando builds nativos travados...\n");
clearLockedNativeBuilds();

const gradleEnv = {
  ...process.env,
  NODE_ENV: "production",
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
  ...(gradleUserHome ? { GRADLE_USER_HOME: gradleUserHome } : {}),
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "http://195.35.40.86:8090",
  // Expo + Gradle 9: configuration-cache quebra por spawn de node no configure.
  ORG_GRADLE_PROJECT_reactNativeArchitectures: "arm64-v8a",
};

console.log("→ Gradle assembleRelease (daemon + cache + parallel, sem configuration-cache)...\n");

const gradleArgs = [
  "assembleRelease",
  "--parallel",
  "--build-cache",
  "--no-configuration-cache",
];

let result = spawnSync(gradle, gradleArgs, {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWin,
  env: gradleEnv,
});

if (result.status !== 0) {
  console.log("\n→ Retry: para daemons, limpa locks e rebuild...\n");
  stopGradleDaemons();
  clearLockedNativeBuilds();
  result = spawnSync(gradle, gradleArgs, {
    cwd: androidDir,
    stdio: "inherit",
    shell: isWin,
    env: gradleEnv,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
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
