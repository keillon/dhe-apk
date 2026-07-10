export type MediaKind = "image" | "video";

export interface MediaPreviewItem {
  id: string;
  uri: string;
  kind: MediaKind;
  thumbnailUri?: string;
}

export function inferMediaKind(url: string, mediaKind?: MediaKind): MediaKind {
  if (mediaKind) return mediaKind;

  const lower = url.toLowerCase();
  if (
    lower.includes("video/") ||
    /\.(mp4|mov|webm|m4v)(\?|$)/.test(lower)
  ) {
    return "video";
  }

  return "image";
}

export function localPhotosToPreviewItems(
  photos: Array<{ uri: string; kind: MediaKind; thumbnailUri?: string }>,
  resolveUri: (uri: string) => string = (uri) => uri
): MediaPreviewItem[] {
  return photos.map((photo, index) => ({
    id: `${photo.uri}-${index}`,
    uri: resolveUri(photo.uri),
    kind: photo.kind,
    thumbnailUri: photo.thumbnailUri ? resolveUri(photo.thumbnailUri) : undefined,
  }));
}
