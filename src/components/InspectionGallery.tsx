import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { PenLine, X } from "lucide-react-native";
import type { InspectionPhoto } from "@/types";
import { colors } from "@/theme";

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
          {title}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.map((photo) => (
            <Pressable key={photo.id} onPress={() => setPreviewUri(photo.url)} className="mr-2">
              <Image
                source={{ uri: photo.url }}
                className="h-20 w-20 rounded-xl"
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
            <Image
              source={{ uri: assinaturaUrl }}
              className="h-24 w-full rounded-xl bg-dhe-elevated"
              contentFit="contain"
            />
          </Pressable>
        </View>
      )}

      <Modal visible={!!previewUri} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreviewUri(null)}
        >
          <Pressable className="absolute right-5 top-12 z-10" onPress={() => setPreviewUri(null)}>
            <X size={28} color="#fff" />
          </Pressable>
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={{ width: "90%", height: "70%" }}
              contentFit="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
