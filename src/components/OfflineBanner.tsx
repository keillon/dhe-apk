import { Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { colors } from "@/theme";

export function OfflineBanner() {
  return (
    <View className="flex-row items-center justify-center border-b border-dhe-warning/30 bg-dhe-elevated px-4 py-3">
      <WifiOff size={16} color={colors.warning} />
      <Text className="ml-2 text-sm font-medium text-dhe-warning">
        Modo offline — dados serão sincronizados quando houver conexão
      </Text>
    </View>
  );
}
