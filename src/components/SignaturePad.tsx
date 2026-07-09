import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { PenLine, PenTool } from "lucide-react-native";
import { colors } from "@/theme";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const router = useRouter();

  const handleOpen = () => {
    router.push("/inspection/signature");
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <PenLine size={16} color={colors.primary} />
        <Text className="ml-2 text-sm font-bold text-dhe-text">Assinatura do cliente</Text>
      </View>

      {value ? (
        <View className="overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
          <Image
            source={{ uri: value }}
            style={{ height: 100, width: "100%" }}
            contentFit="contain"
          />
          <View className="flex-row border-t border-dhe-border">
            <Pressable onPress={handleOpen} className="flex-1 items-center py-3">
              <Text className="text-sm font-semibold text-dhe-primary">Refazer assinatura</Text>
            </Pressable>
            <Pressable onPress={handleClear} className="flex-1 items-center border-l border-dhe-border py-3">
              <Text className="text-sm font-semibold text-dhe-danger">Remover</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={handleOpen}
          className="items-center rounded-2xl border border-dashed border-dhe-border bg-dhe-elevated py-8"
        >
          <PenTool size={28} color={colors.primary} />
          <Text className="mt-3 text-base font-bold text-dhe-primary">Abrir tela de assinatura</Text>
          <Text className="mt-1 px-6 text-center text-xs text-dhe-textMuted">
            Abre em tela cheia no modo paisagem para assinar com mais espaço
          </Text>
        </Pressable>
      )}
    </View>
  );
}
