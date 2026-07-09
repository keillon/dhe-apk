import { View, Text, ScrollView, Pressable, Modal, Image as RNImage } from "react-native";
import { useState } from "react";
import { PenLine, X } from "lucide-react-native";
import type { InspectionPhoto } from "@/types";
import { colors } from "@/theme";

const THUMB_SIZE = 88;

interface InspectionGalleryProps {
  fotos?: InspectionPhoto[];
  assinaturaUrl?: string;
}

function PhotoThumb({
  uri,
  onPress,
}: {
  uri: string;
  onPress: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Pressable onPress={onPress} style={{ marginRight: 8, marginBottom: 8 }}>
      <RNImage
        source={{ uri }}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: 12,
          backgroundColor: colors.elevated,
        }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
      {failed && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 12,
            backgroundColor: colors.elevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-[10px] text-dhe-textMuted">Erro</Text>
        </View>
      )}
    </Pressable>
  );
}

export function InspectionGallery({ fotos = [], assinaturaUrl }: InspectionGalleryProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const antes = fotos.filter((f) => f.tipo === "antes");
  const depois = fotos.filter((f) => f.tipo === "depois");

  if (fotos.length === 0 && !assinaturaUrl) return null;

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
              onPress={() => setPreviewUri(photo.url)}
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

      {assinaturaUrl && (
        <View>
          <View className="mb-2 flex-row items-center">
            <PenLine size={14} color={colors.primary} />
            <Text className="ml-1 text-xs font-bold uppercase tracking-wide text-dhe-primary">
              Assinatura do cliente
            </Text>
          </View>
          <Pressable onPress={() => setPreviewUri(assinaturaUrl)}>
            <RNImage
              source={{ uri: assinaturaUrl }}
              style={{
                height: 110,
                width: "100%",
                borderRadius: 12,
                backgroundColor: colors.elevated,
              }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      )}

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
            <RNImage
              source={{ uri: previewUri }}
              style={{ width: "92%", height: "75%" }}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
