/**
 * Reenvia push de "nova versão" para todos os tokens (sem republicar APK).
 * Uso: npm run notify:apk
 */
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "http://195.35.40.86:8090").replace(/\/$/, "");
const email = process.env.DHE_ADMIN_EMAIL || "admin@dhepr.com.br";
const password = process.env.DHE_ADMIN_PASSWORD || "123456";

async function main() {
  console.log(`\n→ Notificando aparelhos via ${apiUrl}\n`);

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
  const notifyRes = await fetch(`${apiUrl}/api/app/notify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await notifyRes.text();
  if (!notifyRes.ok) {
    console.error("Falha ao notificar:", text);
    process.exit(1);
  }

  console.log("✅ Push enviado:");
  console.log(text);
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
