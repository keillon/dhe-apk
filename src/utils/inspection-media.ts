import type { InspectionPhoto } from "@/types";
import type { LocalPhoto } from "./images";

export function inspectionPhotoToLocal(photo: InspectionPhoto): LocalPhoto {
  return {
    uri: photo.url,
    dataUrl: photo.url,
  };
}

export function localPhotoToPayloadUrl(photo: LocalPhoto): string {
  return photo.dataUrl || photo.uri;
}

export function buildInspectionFotosPayload(
  fotosAntes: LocalPhoto[],
  fotosDepois: LocalPhoto[]
): Array<{ tipo: "antes" | "depois"; url: string }> {
  return [
    ...fotosAntes.map((foto) => ({ tipo: "antes" as const, url: localPhotoToPayloadUrl(foto) })),
    ...fotosDepois.map((foto) => ({ tipo: "depois" as const, url: localPhotoToPayloadUrl(foto) })),
  ];
}
