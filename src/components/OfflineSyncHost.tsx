import { useEffect } from "react";
import { View } from "react-native";
import { useAuthStore } from "@/store";
import { useOfflineSync } from "@/hooks";
import { prefetchEquipmentCache } from "@/services/equipment-cache";
import { api } from "@/services/api";
import { OfflineBanner } from "./OfflineBanner";
import { PendingSyncBanner } from "./PendingSyncBanner";

export function OfflineSyncHost() {
  const { isAuthenticated } = useAuthStore();
  const { isOffline, pendingCount, syncing, retrySync, refreshPendingCount } =
    useOfflineSync(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    void prefetchEquipmentCache(() => api.getEquipments());
    refreshPendingCount();
  }, [isAuthenticated, refreshPendingCount]);

  if (!isAuthenticated) return null;

  return (
    <View>
      {isOffline && <OfflineBanner />}
      <PendingSyncBanner
        pendingCount={pendingCount}
        syncing={syncing}
        onRetry={() => void retrySync()}
      />
    </View>
  );
}
