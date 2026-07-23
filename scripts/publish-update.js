/**
 * Publica atualização OTA (JS/assets) na VPS.
 * Uso: npm run publish:update
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const root = path.resolve(__dirname, "..");
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "http://195.35.40.86:8090").replace(/\/$/, "");
const email = process.env.DHE_ADMIN_EMAIL || "admin@dhepr.com.br";
const password = process.env.DHE_ADMIN_PASSWORD || "123456";
const exportDir = path.join(root, "dist-update");
const zipPath = path.join(os.tmpdir(), `dhe-update-${Date.now()}.zip`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function readRuntimeVersion() {
  const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  const runtime = appJson.expo?.runtimeVersion;
  if (typeof runtime === "string") return runtime;
  if (runtime?.policy === "appVersion") return appJson.expo.version;
  return appJson.expo.version || "1.0.0";
}

async function main() {
  const runtimeVersion = readRuntimeVersion();
  console.log(`\n→ Runtime: ${runtimeVersion}`);
  console.log(`→ API: ${apiUrl}\n`);

  if (fs.existsSync(exportDir)) {
    fs.rmSync(exportDir, { recursive: true, force: true });
  }

  console.log("→ Exportando bundle (expo export)...\n");
  run("npx", ["expo", "export", "--output-dir", "dist-update", "--platform", "android"]);

  const metadataPath = path.join(exportDir, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error("Export falhou: metadata.json não encontrado.");
    process.exit(1);
  }

  const expoConfigPath = path.join(exportDir, "expoConfig.json");
  if (!fs.existsSync(expoConfigPath)) {
    const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
    fs.writeFileSync(expoConfigPath, JSON.stringify(appJson.expo, null, 2));
  }

  console.log("\n→ Compactando ZIP...\n");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  if (process.platform === "win32") {
    const ps = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path '${exportDir}\\*' -DestinationPath '${zipPath}' -Force`,
      ],
      { stdio: "inherit" }
    );
    if (ps.status !== 0) process.exit(ps.status ?? 1);
  } else {
    const zipResult = spawnSync("zip", ["-r", zipPath, "."], {
      cwd: exportDir,
      stdio: "inherit",
    });
    if (zipResult.status !== 0) process.exit(zipResult.status ?? 1);
  }

  console.log("→ Login admin...\n");
  const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    console.error("Falha no login admin:", await loginRes.text());
    process.exit(1);
  }

  const loginJson = await loginRes.json();
  const token = loginJson.token || loginJson.access_token;
  if (!token) {
    console.error("Token não retornado no login.");
    process.exit(1);
  }

  console.log("→ Enviando atualização para a VPS...\n");
  const form = new FormData();
  form.append("bundle", new Blob([fs.readFileSync(zipPath)]), "update.zip");
  form.append("runtimeVersion", runtimeVersion);
  form.append("expoConfig", fs.readFileSync(expoConfigPath, "utf8"));

  const publishRes = await fetch(`${apiUrl}/api/updates/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const publishText = await publishRes.text();
  if (!publishRes.ok) {
    console.error("Falha ao publicar:", publishText);
    process.exit(1);
  }

  console.log("\n✅ Atualização publicada:");
  console.log(publishText);
  console.log("\nOs aparelhos baixam ao reabrir o app (mesma runtimeVersion).\n");

  try {
    fs.unlinkSync(zipPath);
  } catch {
    // ignore
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
