import { useCallback, useState, type ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { colors } from "@/theme";

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  /** Aplica padding generoso padrão (tab = limpa a barra inferior). */
  contentPadding?: "tab" | "stack" | "none";
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function RefreshableScrollView({
  onRefresh,
  children,
  contentPadding = "none",
  contentContainerStyle,
  contentContainerClassName,
  ...props
}: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const {
    horizontalPadding,
    screenTopPadding,
    tabScrollBottomPadding,
    scrollBottomPadding,
  } = useResponsive();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const paddingStyle =
    contentPadding === "tab"
      ? {
          paddingHorizontal: horizontalPadding,
          paddingTop: screenTopPadding,
          paddingBottom: tabScrollBottomPadding,
        }
      : contentPadding === "stack"
        ? {
            paddingHorizontal: horizontalPadding,
            paddingTop: screenTopPadding,
            paddingBottom: scrollBottomPadding,
          }
        : undefined;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      showsVerticalScrollIndicator={false}
      contentContainerClassName={contentPadding === "none" ? contentContainerClassName : undefined}
      contentContainerStyle={[paddingStyle, contentContainerStyle]}
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.card}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
