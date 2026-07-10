export function getRouteParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  const normalized = value?.trim();
  return normalized || undefined;
}
