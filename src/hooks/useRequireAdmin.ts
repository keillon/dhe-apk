import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store";
import { isAdmin } from "@/utils/roles";

export function useRequireAdmin() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const allowed = isAdmin(user);

  useEffect(() => {
    if (isLoading || allowed) return;
    router.replace("/(tabs)");
  }, [isLoading, allowed, router]);

  return { allowed, isLoading };
}
