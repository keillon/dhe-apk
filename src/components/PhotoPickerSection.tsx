import { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, Alert } from "react-native";
import { Image } from "expo-image";
import { Camera, ImagePlus, X, ZoomIn } from "lucide-react-native";
import { colors } from "@/theme";
import {
  pickFromGallery,
  captureMultipleFromCamera,
  type LocalPhoto,
} from "@/utils/images";

interface PhotoPickerSectionProps {
  fotosAntes: LocalPhoto[];
  fotosDepois: LocalPhoto[];
  onChangeAntes: (photos: LocalPhoto[]) => void;
  onChangeDepois: (photos: LocalPhoto[]) => void;
}

const THUMB_SIZE = 96;

function PhotoGrid({
  title,
  photos,
  onChange,
  accentColor,
}: {
  title: string;
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  accentColor: string;
}) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const addFromGallery = async () => {
    const picked = await pickFromGallery(photos.length);
    if (picked.length > 0) onChange([...photos, ...picked]);
  };

  const addFromCamera = async () => {
    if (capturing) return;
    setCapturing(true);

    try {
      let acc = [...photos];
      await captureMultipleFromCamera(photos.length, (photo) => {
        acc = [...acc, photo];
        onChange(acc);
      });
    } finally {
      setCapturing(false);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert("Remover foto", "Deseja remover esta foto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => onChange(photos.filter((_, i) => i !== index)),
      },
    ]);
  };

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-bold" style={{ color: accentColor }}>
          {title}
        </Text>
        <Text className="text-xs text-dhe-textMuted">{photos.length}/5</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
        nestedScrollEnabled
      >
        {photos.map((photo, index) => (
          <Pressable
            key={`${photo.uri}-${index}`}
            onPress={() => setPreviewUri(photo.uri)}
            style={{ marginRight: 8 }}
          >
            <Image
              source={{ uri: photo.uri }}
              style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12 }}
              contentFit="cover"
            />
            <Pressable
              onPress={() => removePhoto(index)}
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.danger,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={12} color="#fff" />
            </Pressable>
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 8,
                padding: 4,
              }}
            >
              <ZoomIn size={10} color="#fff" />
            </View>
          </Pressable>
        ))}

        {photos.length === 0 && (
          <View
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: 12,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.border,
              backgroundColor: colors.elevated,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
          >
            <ImagePlus size={24} color={colors.textMuted} />
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-2">
        <Pressable
          onPress={addFromCamera}
          disabled={capturing || photos.length >= 5}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            capturing || photos.length >= 5 ? "bg-dhe-card opacity-50" : "bg-dhe-elevated"
          }`}
        >
          <Camera size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">
            {capturing ? "Abrindo..." : "Tirar fotos"}
          </Text>
        </Pressable>
        <Pressable
          onPress={addFromGallery}
          disabled={photos.length >= 5}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            photos.length >= 5 ? "bg-dhe-card opacity-50" : "bg-dhe-elevated"
          }`}
        >
          <ImagePlus size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Galeria</Text>
        </Pressable>
      </View>

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

export function PhotoPickerSection({
  fotosAntes,
  fotosDepois,
  onChangeAntes,
  onChangeDepois,
}: PhotoPickerSectionProps) {
  return (
    <View>
      <Text className="mb-3 text-sm font-bold text-dhe-text">Fotos</Text>
      <PhotoGrid
        title="Antes"
        photos={fotosAntes}
        onChange={onChangeAntes}
        accentColor={colors.warning}
      />
      <PhotoGrid
        title="Depois"
        photos={fotosDepois}
        onChange={onChangeDepois}
        accentColor={colors.success}
      />
    </View>
  );
}
