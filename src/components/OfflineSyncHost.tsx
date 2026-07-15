import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store";
import { useOfflineSync } from "@/hooks";
import { prefetchEquipmentCache } from "@/services/equipment-cache";
import { api } from "@/services/api";
import { OfflineBanner } from "./OfflineBanner";
import { PendingSyncBanner } from "./PendingSyncBanner";

export function OfflineSyncHost() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { isOffline, pendingCount, syncing, retrySync, refreshPendingCount } =
    useOfflineSync(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    void prefetchEquipmentCache(() => api.getEquipments());
    refreshPendingCount();
  }, [isAuthenticated, refreshPendingCount]);

  if (!isAuthenticated) return null;
  if (!isOffline && pendingCount <= 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + 8 }]}
    >
      {isOffline ? <OfflineBanner /> : null}
      <PendingSyncBanner
        pendingCount={pendingCount}
        syncing={syncing}
        onRetry={() => void retrySync()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
    elevation: 40,
    gap: 8,
  },
});
