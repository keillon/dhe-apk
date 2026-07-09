import "react-native-gesture-handler";
import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { FeedbackHost } from "@/components";
import { colors } from "@/theme";

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

    const restore = async () => {
      const user = await api.restoreSession();
      if (!mounted) return;
      if (user) setUser(user);
      else setLoading(false);
    };

    restore();

    return () => {
      mounted = false;
    };
  }, [setUser, setLoading]);

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

  return <>{children}</>;
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
            <Stack.Screen
              name="scan"
              options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
            />
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
            <Stack.Screen name="qrcodes/index" />
            <Stack.Screen name="qrcodes/print/[id]" />
            <Stack.Screen name="profile/change-password" />
          </Stack>
        </AuthGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
