import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "@/theme";

interface BackHeaderProps {
  title?: string;
}

export function BackHeader({ title }: BackHeaderProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.back()} className="mb-6 flex-row items-center py-1">
      <ArrowLeft size={22} color={colors.text} />
      <Text className="ml-2 text-base font-semibold text-dhe-text">
        {title ?? "Voltar"}
      </Text>
    </Pressable>
  );
}
