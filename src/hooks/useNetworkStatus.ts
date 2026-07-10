import { useCallback, useEffect, useRef, useState } from "react";
import * as Network from "expo-network";
import { feedback } from "@/services/feedback";
import {
  getPendingInspectionCount,
  syncPendingInspections,
} from "@/services/offline-sync";
import { prefetchEquipmentCache } from "@/services/equipment-cache";
import { api } from "@/services/api";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? true);
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, isOffline: !isConnected };
}

export function useOfflineSync(enabled = true) {
  const { isConnected, isOffline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const wasOfflineRef = useRef(isOffline);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingInspectionCount());
  }, []);

  const runSync = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || syncingRef.current || getPendingInspectionCount() === 0) {
        refreshPendingCount();
        return { synced: 0, failed: 0, skipped: 0 };
      }

      syncingRef.current = true;
      setSyncing(true);

      try {
        const result = await syncPendingInspections();
        refreshPendingCount();

        if (!options?.silent) {
          if (result.synced > 0) {
            feedback.toast.success(
              `${result.synced} inspeção(ões) enviada(s) com sucesso.`
            );
          }
          if (result.failed > 0) {
            feedback.toast.warning(
              `${result.failed} inspeção(ões) não enviada(s). Toque em reenviar.`
            );
          }
        }

        return result;
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    },
    [enabled, refreshPendingCount]
  );

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!enabled) return;

    if (wasOfflineRef.current && isConnected) {
      void prefetchEquipmentCache(() => api.getEquipments());
      void runSync({ silent: false });
    }

    wasOfflineRef.current = isOffline;
  }, [enabled, isConnected, isOffline, runSync]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const interval = setInterval(() => {
      if (getPendingInspectionCount() > 0) {
        void runSync({ silent: true });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [enabled, isConnected, runSync]);

  return {
    isOffline,
    isConnected,
    pendingCount,
    syncing,
    refreshPendingCount,
    retrySync: () => runSync({ silent: false }),
  };
}
