import { useCallback, useState, type ReactNode } from "react";
import { RefreshControl, ScrollView, type ScrollViewProps } from "react-native";
import { colors } from "@/theme";

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
}

export function RefreshableScrollView({
  onRefresh,
  children,
  ...props
}: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
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
