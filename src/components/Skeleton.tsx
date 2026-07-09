import { View } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ width = "100%", height = 20, className, rounded = true }: SkeletonProps) {
  return (
    <View
      className={`bg-dhe-border ${rounded ? "rounded-xl" : ""} ${className ?? ""}`}
      style={{ width: width as number, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-dhe">
      <Skeleton height={24} width="60%" className="mb-3" />
      <Skeleton height={16} width="40%" className="mb-2" />
      <Skeleton height={16} width="80%" />
    </View>
  );
}
