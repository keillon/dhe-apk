import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { colors } from "@/theme";
import { pickFromCamera, pickFromGallery, type LocalPhoto } from "@/utils/images";

interface PhotoPickerSectionProps {
  fotosAntes: LocalPhoto[];
  fotosDepois: LocalPhoto[];
  onChangeAntes: (photos: LocalPhoto[]) => void;
  onChangeDepois: (photos: LocalPhoto[]) => void;
}

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
  const addFromGallery = async () => {
    const picked = await pickFromGallery(photos.length);
    if (picked.length > 0) onChange([...photos, ...picked]);
  };

  const addFromCamera = async () => {
    const picked = await pickFromCamera(photos.length);
    if (picked) onChange([...photos, picked]);
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold" style={{ color: accentColor }}>
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} className="relative mr-2">
            <Image
              source={{ uri: photo.uri }}
              className="h-24 w-24 rounded-xl"
              contentFit="cover"
            />
            <Pressable
              onPress={() => removePhoto(index)}
              className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-dhe-danger"
            >
              <X size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
        {photos.length === 0 && (
          <View className="mr-2 h-24 w-24 items-center justify-center rounded-xl border border-dashed border-dhe-border bg-dhe-elevated">
            <ImagePlus size={24} color={colors.textMuted} />
          </View>
        )}
      </ScrollView>
      <View className="flex-row gap-2">
        <Pressable
          onPress={addFromCamera}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-elevated py-3"
        >
          <Camera size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Câmera</Text>
        </Pressable>
        <Pressable
          onPress={addFromGallery}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-elevated py-3"
        >
          <ImagePlus size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Galeria</Text>
        </Pressable>
      </View>
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
