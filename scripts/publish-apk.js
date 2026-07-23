/**
 * Publica o APK na VPS para download/instalação pelo app.
 * Uso: npm run publish:apk -- path/to/app-release.apk
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "http://195.35.40.86:8090").replace(/\/$/, "");
const email = process.env.DHE_ADMIN_EMAIL || "admin@dhepr.com.br";
const password = process.env.DHE_ADMIN_PASSWORD || "123456";

function readVersion() {
  const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  return {
    version: appJson.expo.version || "1.0.0",
    versionCode: appJson.expo.android?.versionCode || 1,
  };
}

function resolveApkPath() {
  const arg = process.argv[2];
  if (arg && fs.existsSync(arg)) return path.resolve(arg);

  const candidates = [
    path.join(root, "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
    path.join(process.env.USERPROFILE || "", "Desktop", "DHE-Hidraulicos.apk"),
  ];

  return candidates.find((file) => fs.existsSync(file)) || null;
}

async function main() {
  const apkPath = resolveApkPath();
  if (!apkPath) {
    console.error("APK não encontrado. Passe o caminho: npm run publish:apk -- ./app-release.apk");
    process.exit(1);
  }

  const { version, versionCode } = readVersion();
  console.log(`\n→ APK: ${apkPath}`);
  console.log(`→ Versão: ${version} (${versionCode})`);
  console.log(`→ API: ${apiUrl}\n`);

  const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    console.error("Login admin falhou:", await loginRes.text());
    process.exit(1);
  }

  const { token } = await loginRes.json();
  const form = new FormData();
  form.append("apk", new Blob([fs.readFileSync(apkPath)]), "dhe-hidraulicos.apk");
  form.append("version", version);
  form.append("versionCode", String(versionCode));
  form.append("notes", process.env.DHE_APK_NOTES || `Atualização ${version}`);

  const publishRes = await fetch(`${apiUrl}/api/app/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const text = await publishRes.text();
  if (!publishRes.ok) {
    console.error("Falha ao publicar APK:", text);
    process.exit(1);
  }

  console.log("\n✅ APK publicado na VPS:");
  console.log(text);
  console.log(
    "\nPush de atualização enviado aos aparelhos (se o servidor estiver com a versão nova do /api/app/publish)."
  );
  console.log("Reenviar push sem republicar: npm run notify:apk\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
