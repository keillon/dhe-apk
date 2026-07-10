import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { feedback } from "@/services/feedback";
import type { MediaKind } from "./media";
import { createLocalVideoFromUri } from "./video";

export interface LocalPhoto {
  uri: string;
  dataUrl: string;
  kind: MediaKind;
  thumbnailUri?: string;
  withAudio?: boolean;
}

const MAX_MEDIA_PER_TYPE = 5;
const IMAGE_QUALITY = 0.5;
const MAX_VIDEO_DURATION_SEC = 45;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const VIDEO_QUALITY = ImagePicker.UIImagePickerControllerQualityType.Low;

function guessMimeType(uri: string, mimeType?: string | null): string {
  if (mimeType) return mimeType;
  if (uri.toLowerCase().endsWith(".png")) return "image/png";
  return "image/jpeg";
}

const PROFILE_IMAGE_QUALITY = 0.4;

const EQUIPMENT_IMAGE_QUALITY = 0.5;

export async function pickEquipmentImage(source: "camera" | "gallery"): Promise<LocalPhoto | null> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      await feedback.alert("Permissão necessária", "Permita o acesso à câmera para tirar uma foto.");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: EQUIPMENT_IMAGE_QUALITY,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return null;
    return assetToLocalPhoto(result.assets[0]);
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    await feedback.alert("Permissão necessária", "Permita o acesso à galeria para escolher uma foto.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: EQUIPMENT_IMAGE_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return assetToLocalPhoto(result.assets[0]);
}

export async function pickProfileImage(source: "camera" | "gallery"): Promise<LocalPhoto | null> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      await feedback.alert("Permissão necessária", "Permita o acesso à câmera para tirar uma foto.");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: PROFILE_IMAGE_QUALITY,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return null;
    return assetToLocalPhoto(result.assets[0]);
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    await feedback.alert("Permissão necessária", "Permita o acesso à galeria para escolher uma foto.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: PROFILE_IMAGE_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return assetToLocalPhoto(result.assets[0]);
}

export async function assetToLocalPhoto(
  asset: ImagePicker.ImagePickerAsset
): Promise<LocalPhoto> {
  const mime = guessMimeType(asset.uri, asset.mimeType);

  if (asset.base64) {
    return {
      uri: asset.uri,
      dataUrl: `data:${mime};base64,${asset.base64}`,
      kind: "image",
    };
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      uri: asset.uri,
      dataUrl: `data:${mime};base64,${base64}`,
      kind: "image",
    };
  } catch {
    return {
      uri: asset.uri,
      dataUrl: asset.uri,
      kind: "image",
    };
  }
}

export async function pickFromGallery(
  currentCount: number,
  max = MAX_MEDIA_PER_TYPE
): Promise<LocalPhoto[]> {
  const remaining = max - currentCount;
  if (remaining <= 0) {
    await feedback.alert("Limite atingido", `Máximo de ${max} fotos por categoria.`);
    return [];
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    await feedback.alert("Permissão necessária", "Permita o acesso à galeria para adicionar fotos.");
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: IMAGE_QUALITY,
    base64: true,
  });

  if (result.canceled) return [];

  return Promise.all(result.assets.map(assetToLocalPhoto));
}

async function takeSinglePhoto(): Promise<LocalPhoto | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    await feedback.alert("Permissão necessária", "Permita o acesso à câmera para tirar fotos.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: IMAGE_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  return assetToLocalPhoto(result.assets[0]);
}

export async function captureMultipleFromCamera(
  currentCount: number,
  onPhotoTaken: (photo: LocalPhoto) => void,
  max = MAX_MEDIA_PER_TYPE
): Promise<void> {
  let count = currentCount;

  while (count < max) {
    const photo = await takeSinglePhoto();
    if (!photo) break;

    onPhotoTaken(photo);
    count++;

    if (count >= max) {
      await feedback.alert("Limite atingido", `Máximo de ${max} fotos por categoria.`);
      break;
    }

    const takeMore = await feedback.choose("Foto adicionada", "Deseja tirar outra foto?", [
      { text: "Não", value: "no", style: "cancel" },
      { text: "Tirar outra", value: "yes", style: "primary" },
    ]);

    if (takeMore !== "yes") break;
  }
}

export async function pickFromCamera(
  currentCount: number,
  max = MAX_MEDIA_PER_TYPE
): Promise<LocalPhoto | null> {
  if (currentCount >= max) {
    await feedback.alert("Limite atingido", `Máximo de ${max} fotos por categoria.`);
    return null;
  }

  return takeSinglePhoto();
}

export function getPhotoPreviewUri(photo: LocalPhoto): string {
  if (photo.kind === "video" && photo.thumbnailUri) {
    return photo.thumbnailUri;
  }

  return photo.uri.startsWith("file:") || photo.uri.startsWith("content:")
    ? photo.uri
    : photo.dataUrl;
}

export function getVideoPlaybackUri(photo: LocalPhoto): string {
  return photo.uri.startsWith("file:") || photo.uri.startsWith("content:")
    ? photo.uri
    : photo.dataUrl || photo.uri;
}

async function assetToLocalVideo(asset: ImagePicker.ImagePickerAsset): Promise<LocalPhoto> {
  return createLocalVideoFromUri(asset.uri, true);
}

export async function pickVideoFromGallery(
  currentCount: number,
  max = MAX_MEDIA_PER_TYPE
): Promise<LocalPhoto | null> {
  if (currentCount >= max) {
    await feedback.alert("Limite atingido", `Máximo de ${max} itens por categoria.`);
    return null;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    await feedback.alert("Permissão necessária", "Permita o acesso à galeria para adicionar vídeos.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsMultipleSelection: false,
    videoMaxDuration: MAX_VIDEO_DURATION_SEC,
    videoQuality: VIDEO_QUALITY,
    videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
  });

  if (result.canceled || !result.assets[0]) return null;

  try {
    return await assetToLocalVideo(result.assets[0]);
  } catch (error) {
    if (error instanceof Error && error.message === "VIDEO_TOO_LARGE") {
      await feedback.alert(
        "Vídeo muito grande",
        "Escolha um vídeo mais curto. O limite é cerca de 20 MB após compressão."
      );
      return null;
    }
    await feedback.alert("Erro", "Não foi possível processar o vídeo selecionado.");
    return null;
  }
}

export async function handleVideoTooLargeError(): Promise<void> {
  await feedback.alert(
    "Vídeo muito grande",
    "Escolha um vídeo mais curto. O limite é cerca de 20 MB."
  );
}
