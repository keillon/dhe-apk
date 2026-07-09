import { useCallback, useRef } from "react";
import { useRouter, type Href } from "expo-router";

export function useSafeBack(fallback: Href = "/(tabs)") {
  const router = useRouter();
  const navigatingRef = useRef(false);

  return useCallback(() => {
    if (navigatingRef.current) return;

    navigatingRef.current = true;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }

    setTimeout(() => {
      navigatingRef.current = false;
    }, 600);
  }, [router, fallback]);
}
