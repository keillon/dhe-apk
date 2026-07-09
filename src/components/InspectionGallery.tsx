import { View, Text, Pressable, Modal } from "react-native";
import { useState } from "react";
import { PenLine, X } from "lucide-react-native";
import type { InspectionPhoto } from "@/types";
import { DisplayImage } from "./DisplayImage";
import { resolveMediaUrl } from "@/utils/media-url";
import { colors } from "@/theme";

const THUMB_SIZE = 88;

interface InspectionGalleryProps {
  fotos?: InspectionPhoto[];
  assinaturaUrl?: string;
}

function PhotoThumb({ uri, onPress }: { uri: string; onPress: () => void }) {
  const resolved = resolveMediaUrl(uri);
  return (
    <Pressable onPress={onPress} style={{ marginRight: 8, marginBottom: 8 }}>
      <DisplayImage
        uri={resolved}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: 12,
        }}
        resizeMode="cover"
      />
    </Pressable>
  );
}

export function InspectionGallery({ fotos = [], assinaturaUrl }: InspectionGalleryProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const antes = fotos.filter((f) => f.tipo === "antes");
  const depois = fotos.filter((f) => f.tipo === "depois");

  const renderPhotoGrid = (title: string, photos: InspectionPhoto[], accent: string) => {
    if (photos.length === 0) return null;

    return (
      <View className="mb-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
          {title} ({photos.length})
        </Text>
        <View className="flex-row flex-wrap">
          {photos.map((photo) => (
            <PhotoThumb
              key={photo.id}
              uri={photo.url}
              onPress={() => setPreviewUri(resolveMediaUrl(photo.url))}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View>
      {renderPhotoGrid("Antes", antes, colors.warning)}
      {renderPhotoGrid("Depois", depois, colors.success)}

      {assinaturaUrl ? (
        <View>
          <View className="mb-2 flex-row items-center">
            <PenLine size={14} color={colors.primary} />
            <Text className="ml-1 text-xs font-bold uppercase tracking-wide text-dhe-primary">
              Assinatura do cliente
            </Text>
          </View>
          <Pressable onPress={() => setPreviewUri(resolveMediaUrl(assinaturaUrl))}>
            <DisplayImage
              uri={resolveMediaUrl(assinaturaUrl)}
              style={{
                height: 110,
                width: "100%",
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      ) : null}

      {!fotos.length && !assinaturaUrl ? (
        <Text className="text-sm text-dhe-textMuted">Nenhuma mídia disponível para exibir.</Text>
      ) : null}

      <Modal visible={!!previewUri} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreviewUri(null)}
        >
          <Pressable
            style={{ position: "absolute", top: 48, right: 20, zIndex: 10 }}
            onPress={() => setPreviewUri(null)}
          >
            <X size={28} color="#fff" />
          </Pressable>
          {previewUri && (
            <DisplayImage
              uri={previewUri}
              style={{ width: "92%", height: "75%" }}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
