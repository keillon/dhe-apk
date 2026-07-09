import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface LocalPhoto {
  uri: string;
  dataUrl: string;
}

const MAX_PHOTOS_PER_TYPE = 5;

export function assetToDataUrl(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.base64) {
    const mime = asset.mimeType ?? "image/jpeg";
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri;
}

export async function pickFromGallery(
  currentCount: number,
  max = MAX_PHOTOS_PER_TYPE
): Promise<LocalPhoto[]> {
  const remaining = max - currentCount;
  if (remaining <= 0) {
    Alert.alert("Limite atingido", `Máximo de ${max} fotos por categoria.`);
    return [];
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permissão necessária", "Permita o acesso à galeria para adicionar fotos.");
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.6,
    base64: true,
  });

  if (result.canceled) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    dataUrl: assetToDataUrl(asset),
  }));
}

export async function pickFromCamera(
  currentCount: number,
  max = MAX_PHOTOS_PER_TYPE
): Promise<LocalPhoto | null> {
  if (currentCount >= max) {
    Alert.alert("Limite atingido", `Máximo de ${max} fotos por categoria.`);
    return null;
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permissão necessária", "Permita o acesso à câmera para tirar fotos.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.6,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    dataUrl: assetToDataUrl(asset),
  };
}
