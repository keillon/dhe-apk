export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("file:") ||
    url.startsWith("content:")
  ) {
    return url;
  }

  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  if (!base) return url;

  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
