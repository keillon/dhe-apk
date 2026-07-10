import * as VideoThumbnails from "expo-video-thumbnails";
import * as FileSystem from "expo-file-system/legacy";
import type { LocalPhoto } from "./images";

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export async function generateVideoThumbnail(uri: string): Promise<string | undefined> {
  try {
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
      time: 500,
      quality: 0.5,
    });
    return thumbnailUri;
  } catch {
    return undefined;
  }
}

export async function createLocalVideoFromUri(
  uri: string,
  withAudio = true
): Promise<LocalPhoto> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && "size" in info && info.size && info.size > MAX_VIDEO_BYTES) {
    throw new Error("VIDEO_TOO_LARGE");
  }

  const thumbnailUri = await generateVideoThumbnail(uri);

  return {
    uri,
    dataUrl: "",
    kind: "video",
    thumbnailUri,
    withAudio,
  };
}

export async function encodeLocalPhotoForUpload(photo: LocalPhoto): Promise<LocalPhoto> {
  if (photo.kind !== "video") return photo;
  if (photo.dataUrl.startsWith("data:")) return photo;

  const info = await FileSystem.getInfoAsync(photo.uri);
  if (info.exists && "size" in info && info.size && info.size > MAX_VIDEO_BYTES) {
    throw new Error("VIDEO_TOO_LARGE");
  }

  const mime = photo.uri.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4";
  const base64 = await FileSystem.readAsStringAsync(photo.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    ...photo,
    dataUrl: `data:${mime};base64,${base64}`,
  };
}

export function getLocalMediaThumbUri(photo: LocalPhoto): string {
  if (photo.kind === "video" && photo.thumbnailUri) {
    return photo.thumbnailUri;
  }

  return photo.uri.startsWith("file:") ||
    photo.uri.startsWith("content:") ||
    photo.uri.startsWith("http")
    ? photo.uri
    : photo.dataUrl;
}
