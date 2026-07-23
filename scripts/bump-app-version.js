/**
 * Incrementa versionCode (+1) e o patch de version (1.0.1 → 1.0.2).
 * Sincroniza android/app/build.gradle para builds com --skip-prebuild.
 *
 * Uso: node scripts/bump-app-version.js
 *      node scripts/bump-app-version.js --set 1.0.3 4
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appJsonPath = path.join(root, "app.json");
const gradlePath = path.join(root, "android", "app", "build.gradle");

function bumpSemverPatch(version) {
  const parts = String(version).split(".").map((part) => Number(part));
  while (parts.length < 3) parts.push(0);
  parts[2] = (Number.isFinite(parts[2]) ? parts[2] : 0) + 1;
  return parts.slice(0, 3).join(".");
}

function syncAndroidGradle(version, versionCode) {
  if (!fs.existsSync(gradlePath)) {
    console.log("→ android/app/build.gradle ausente (ok se ainda não fez prebuild)");
    return;
  }

  let gradle = fs.readFileSync(gradlePath, "utf8");
  if (!/versionCode\s+\d+/.test(gradle) || !/versionName\s+"[^"]+"/.test(gradle)) {
    console.warn("→ Não achei versionCode/versionName no build.gradle");
    return;
  }

  gradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);

  fs.writeFileSync(gradlePath, gradle, "utf8");
  console.log(`→ Gradle sincronizado: ${version} (${versionCode})`);
}

function main() {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  const expo = appJson.expo;
  const setIdx = process.argv.indexOf("--set");

  let version;
  let versionCode;

  if (setIdx >= 0) {
    version = process.argv[setIdx + 1];
    versionCode = Number(process.argv[setIdx + 2]);
    if (!version || !Number.isFinite(versionCode) || versionCode < 1) {
      console.error("Uso: node scripts/bump-app-version.js --set 1.0.3 4");
      process.exit(1);
    }
  } else {
    const currentCode = Number(expo.android?.versionCode || 1);
    versionCode = currentCode + 1;
    version = bumpSemverPatch(expo.version || "1.0.0");
  }

  expo.version = version;
  expo.runtimeVersion = version;
  expo.android = { ...(expo.android || {}), versionCode };

  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, "utf8");
  syncAndroidGradle(version, versionCode);

  console.log(`\n✅ Versão: ${version} (versionCode ${versionCode})\n`);
}

main();
