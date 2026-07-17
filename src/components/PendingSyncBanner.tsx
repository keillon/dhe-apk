import { Pressable, Text, View } from "react-native";
import { CloudUpload, RefreshCw } from "lucide-react-native";
import { colors } from "@/theme";

interface PendingSyncBannerProps {
  pendingCount: number;
  syncing: boolean;
  onRetry: () => void;
}

export function PendingSyncBanner({ pendingCount, syncing, onRetry }: PendingSyncBannerProps) {
  if (pendingCount <= 0) return null;

  return (
    <View className="rounded-2xl border border-dhe-primary/40 bg-dhe-card px-5 py-4 shadow-lg shadow-black/40">
      <View className="flex-row items-center">
        <CloudUpload size={16} color={colors.primary} />
        <Text className="ml-2 flex-1 text-sm font-medium text-dhe-text">
          {syncing
            ? "Sincronizando automaticamente..."
            : `${pendingCount} inspeção(ões) pendente(s)`}
        </Text>
        {!syncing ? (
          <Pressable
            onPress={onRetry}
            className="flex-row items-center rounded-full bg-dhe-primary/15 px-3 py-1.5"
          >
            <RefreshCw size={14} color={colors.primary} />
            <Text className="ml-1 text-xs font-semibold text-dhe-primary">Reenviar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
