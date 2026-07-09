import { View, Text, ScrollView, Pressable, Modal, Image as RNImage } from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { PenLine, X } from "lucide-react-native";
import type { InspectionPhoto } from "@/types";
import { colors } from "@/theme";

const THUMB_SIZE = 80;

interface InspectionGalleryProps {
  fotos?: InspectionPhoto[];
  assinaturaUrl?: string;
}

export function InspectionGallery({ fotos = [], assinaturaUrl }: InspectionGalleryProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const antes = fotos.filter((f) => f.tipo === "antes");
  const depois = fotos.filter((f) => f.tipo === "depois");

  if (fotos.length === 0 && !assinaturaUrl) return null;

  const renderPhotoRow = (title: string, photos: InspectionPhoto[], accent: string) => {
    if (photos.length === 0) return null;

    return (
      <View className="mb-3">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
          {title} ({photos.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => setPreviewUri(photo.url)}
              style={{ marginRight: 8 }}
            >
              <Image
                source={{ uri: photo.url }}
                style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12 }}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View>
      {renderPhotoRow("Antes", antes, colors.warning)}
      {renderPhotoRow("Depois", depois, colors.success)}

      {assinaturaUrl && (
        <View>
          <View className="mb-2 flex-row items-center">
            <PenLine size={14} color={colors.primary} />
            <Text className="ml-1 text-xs font-bold uppercase tracking-wide text-dhe-primary">
              Assinatura
            </Text>
          </View>
          <Pressable onPress={() => setPreviewUri(assinaturaUrl)}>
            <RNImage
              source={{ uri: assinaturaUrl }}
              style={{
                height: 96,
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
            <Image
              source={{ uri: previewUri }}
              style={{ width: "92%", height: "75%" }}
              contentFit="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
