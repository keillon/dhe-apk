import { Redirect } from "expo-router";
import { Loading } from "@/components";
import { useAuthStore } from "@/store";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <Loading fullScreen />;

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />;
}
