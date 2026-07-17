import { Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { colors } from "@/theme";

export function OfflineBanner() {
  return (
    <View className="flex-row items-center rounded-2xl border border-dhe-warning/40 bg-dhe-card px-5 py-4 shadow-lg shadow-black/40">
      <WifiOff size={16} color={colors.warning} />
      <Text className="ml-2 flex-1 text-sm font-medium text-dhe-warning">
        Sem internet — inspeções ficam na fila e sincronizam automaticamente
      </Text>
    </View>
  );
}
