import { ActivityIndicator, View } from "react-native";
import { colors } from "@/theme";

export function Loading({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <View className="items-center justify-center p-8">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 items-center justify-center bg-dhe-surface">{content}</View>;
  }
  return content;
}
