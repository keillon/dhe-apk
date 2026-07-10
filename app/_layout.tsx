import "react-native-gesture-handler";
import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { FeedbackHost } from "@/components/FeedbackHost";
import { OfflineSyncHost } from "@/components/OfflineSyncHost";
import { bootstrapLogging, logger } from "@/utils/logger";
import { colors } from "@/theme";
import { prefetchEquipmentCache } from "@/services/equipment-cache";
import { hydrateStorage } from "@/services/storage";

bootstrapLogging();

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (!mounted) return;
      logger.warn("App", "Timeout no startup — liberando tela");
      setLoading(false);
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);

    const restore = async () => {
      void hydrateStorage().catch((error) => {
        logger.error("App", "Falha ao carregar cache offline", error);
      });

      try {
        const user = await api.restoreSession();
        if (!mounted) return;

        if (user) {
          setUser(user);
          void prefetchEquipmentCache(() => api.getEquipments());
          return;
        }

        setLoading(false);
      } catch (error) {
        logger.error("App", "Erro ao restaurar sessão", error);
        if (mounted) setLoading(false);
      } finally {
        clearTimeout(safetyTimer);
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    restore();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [setUser, setLoading]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <OfflineSyncHost />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <StatusBar style="light" />
          <FeedbackHost />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="scan" />
            <Stack.Screen name="equipment/[id]" />
            <Stack.Screen name="inspection/new" />
            <Stack.Screen name="inspection/[id]" />
            <Stack.Screen name="inspection/edit/[id]" />
            <Stack.Screen
              name="inspection/signature"
              options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="equipment/history/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="client/[id]" />
            <Stack.Screen name="client/new" />
            <Stack.Screen name="client/edit/[id]" />
            <Stack.Screen name="equipment/new" />
            <Stack.Screen name="equipment/edit/[id]" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="qrcodes/index" />
            <Stack.Screen name="qrcodes/print/[id]" />
            <Stack.Screen name="profile/change-password" />
          </Stack>
        </AuthGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
