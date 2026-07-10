import type { InspectionPhoto, MediaKind } from "@/types";
import type { LocalPhoto } from "./images";
import { getVideoPlaybackUri } from "./images";
import { inferMediaKind } from "./media";
import { encodeLocalPhotoForUpload } from "./video";

export function inspectionPhotoToLocal(photo: InspectionPhoto): LocalPhoto {
  return {
    uri: photo.url,
    dataUrl: photo.url,
    kind: inferMediaKind(photo.url, photo.media_kind),
  };
}

export function localPhotoToPayloadUrl(photo: LocalPhoto): string {
  return photo.dataUrl || photo.uri;
}

async function preparePhotosForUpload(photos: LocalPhoto[]): Promise<LocalPhoto[]> {
  return Promise.all(photos.map(encodeLocalPhotoForUpload));
}

export async function buildInspectionFotosPayloadAsync(
  fotosAntes: LocalPhoto[],
  fotosDepois: LocalPhoto[]
): Promise<Array<{ tipo: "antes" | "depois"; url: string; media_kind: MediaKind }>> {
  const [preparedAntes, preparedDepois] = await Promise.all([
    preparePhotosForUpload(fotosAntes),
    preparePhotosForUpload(fotosDepois),
  ]);

  return [
    ...preparedAntes.map((foto) => ({
      tipo: "antes" as const,
      url: localPhotoToPayloadUrl(foto),
      media_kind: foto.kind,
    })),
    ...preparedDepois.map((foto) => ({
      tipo: "depois" as const,
      url: localPhotoToPayloadUrl(foto),
      media_kind: foto.kind,
    })),
  ];
}

/** @deprecated Use buildInspectionFotosPayloadAsync */
export function buildInspectionFotosPayload(
  fotosAntes: LocalPhoto[],
  fotosDepois: LocalPhoto[]
): Array<{ tipo: "antes" | "depois"; url: string; media_kind: MediaKind }> {
  return [
    ...fotosAntes.map((foto) => ({
      tipo: "antes" as const,
      url: localPhotoToPayloadUrl(foto),
      media_kind: foto.kind,
    })),
    ...fotosDepois.map((foto) => ({
      tipo: "depois" as const,
      url: localPhotoToPayloadUrl(foto),
      media_kind: foto.kind,
    })),
  ];
}

export function countPendingVideos(fotosAntes: LocalPhoto[], fotosDepois: LocalPhoto[]): number {
  return [...fotosAntes, ...fotosDepois].filter(
    (photo) => photo.kind === "video" && !photo.dataUrl.startsWith("data:")
  ).length;
}

export { getVideoPlaybackUri };
