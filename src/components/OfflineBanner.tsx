import { Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";

export function OfflineBanner() {
  return (
    <View className="flex-row items-center justify-center bg-dhe-dark px-4 py-2">
      <WifiOff size={14} color="#7CBFE0" />
      <Text className="ml-2 text-xs font-medium text-dhe-light">
        Modo offline — dados serão sincronizados quando houver conexão
      </Text>
    </View>
  );
}
