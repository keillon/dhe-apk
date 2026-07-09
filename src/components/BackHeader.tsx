import { Pressable, Text } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useSafeBack } from "@/hooks/useSafeBack";
import { colors } from "@/theme";
import type { Href } from "expo-router";

interface BackHeaderProps {
  title?: string;
  fallback?: Href;
}

export function BackHeader({ title, fallback }: BackHeaderProps) {
  const goBack = useSafeBack(fallback);

  return (
    <Pressable
      onPress={goBack}
      hitSlop={12}
      className="mb-4 flex-row items-center py-2"
    >
      <ArrowLeft size={22} color={colors.text} />
      <Text className="ml-2 text-base font-semibold text-dhe-text">
        {title ?? "Voltar"}
      </Text>
    </Pressable>
  );
}
