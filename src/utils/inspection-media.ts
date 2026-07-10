import type { InspectionPhoto, MediaKind } from "@/types";
import type { LocalPhoto } from "./images";
import { inferMediaKind } from "./media";

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
