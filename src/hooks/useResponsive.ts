import { useMemo } from "react";
import { Platform, useWindowDimensions, PixelRatio } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Baseline design width (iPhone 11 / common Android). */
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fontScale = PixelRatio.getFontScale();

  return useMemo(() => {
    const shortest = Math.min(width, height);
    const longest = Math.max(width, height);
    const widthScale = shortest / BASE_WIDTH;

    const isSmallPhone = shortest < 360 || longest < 700;
    const isCompactHeight = height < 720;
    const isTablet = shortest >= 600;

    const scale = (size: number, options?: { min?: number; max?: number }) => {
      const scaled = size * clamp(widthScale, 0.85, isTablet ? 1.25 : 1.1);
      return Math.round(clamp(scaled, options?.min ?? size * 0.8, options?.max ?? size * 1.25));
    };

    const moderateScale = (size: number, factor = 0.4) => {
      const scaled = size + (widthScale * size - size) * factor;
      return Math.round(clamp(scaled, size * 0.85, size * 1.2));
    };

    const horizontalPadding = isTablet ? 32 : isSmallPhone ? 16 : 20;
    const contentMaxWidth = isTablet ? 560 : width;
    const tabBarContentHeight = isSmallPhone ? 52 : 56;
    const tabBarHeight = tabBarContentHeight + Math.max(insets.bottom, 8);
    const screenTopPadding = isCompactHeight ? 16 : 20;
    const scrollBottomPadding = Math.max(insets.bottom, 16) + (isCompactHeight ? 32 : 48);
    const tabScrollBottomPadding = tabBarHeight + 24;

    return {
      width,
      height,
      insets,
      fontScale,
      isSmallPhone,
      isCompactHeight,
      isTablet,
      isAndroid: Platform.OS === "android",
      isIOS: Platform.OS === "ios",
      scale,
      moderateScale,
      horizontalPadding,
      contentMaxWidth,
      screenTopPadding,
      tabBarContentHeight,
      tabBarHeight,
      /** Safe content bottom padding for stack forms (keyboard + home indicator). */
      scrollBottomPadding,
      /** Extra clearance so lists clear the bottom tab bar. */
      tabScrollBottomPadding,
      /** KeyboardAvoidingView behavior that works best per platform. */
      keyboardBehavior: Platform.OS === "ios" ? ("padding" as const) : undefined,
      keyboardVerticalOffset: Platform.OS === "ios" ? insets.top : 0,
    };
  }, [width, height, insets, fontScale]);
}
