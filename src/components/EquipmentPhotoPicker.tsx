import { Pressable, Text, View } from "react-native";
import { Camera, ImageIcon, Trash2 } from "lucide-react-native";
import { DisplayImage, Button } from "@/components";
import { feedback } from "@/services/feedback";
import { getPhotoPreviewUri, pickEquipmentImage, resolveMediaUrl } from "@/utils";
import { colors } from "@/theme";

interface EquipmentPhotoPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function EquipmentPhotoPicker({ value, onChange }: EquipmentPhotoPickerProps) {
  const previewUri = value
    ? value.startsWith("data:")
      ? getPhotoPreviewUri({ uri: value, dataUrl: value })
      : resolveMediaUrl(value)
    : null;

  const handlePick = async () => {
    const source = await feedback.choose("Foto do equipamento", "Como deseja adicionar a foto?", [
      { text: "Galeria", value: "gallery", style: "default" },
      { text: "Câmera", value: "camera", style: "primary" },
    ]);

    if (source !== "gallery" && source !== "camera") return;

    const photo = await pickEquipmentImage(source);
    if (!photo?.dataUrl.startsWith("data:")) {
      feedback.toast.error("Não foi possível processar a imagem. Tente outra foto.");
      return;
    }

    onChange(photo.dataUrl);
  };

  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold text-dhe-textSecondary">
        Foto do equipamento (opcional)
      </Text>

      <View className="overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
        {previewUri ? (
          <DisplayImage
            uri={previewUri}
            style={{ width: "100%", height: 200 }}
            resizeMode="cover"
          />
        ) : (
          <View className="h-48 items-center justify-center">
            <ImageIcon size={40} color={colors.textMuted} />
            <Text className="mt-2 text-sm text-dhe-textMuted">
              Adicione uma foto para identificar a máquina
            </Text>
          </View>
        )}

        <View className="flex-row gap-2 p-3">
          <Button
            title={previewUri ? "Trocar foto" : "Adicionar foto"}
            onPress={handlePick}
            variant="secondary"
            className="flex-1"
            icon={<Camera size={16} color={colors.text} />}
          />
          {previewUri && (
            <Pressable
              onPress={() => onChange(undefined)}
              className="items-center justify-center rounded-xl bg-dhe-danger/15 px-4"
            >
              <Trash2 size={18} color={colors.danger} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
