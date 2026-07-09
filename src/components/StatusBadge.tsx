import { Text, View } from "react-native";
import { getStatusColor, getStatusLabel } from "@/utils";
import type { EquipmentStatus } from "@/types";

interface StatusBadgeProps {
  status: EquipmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = getStatusColor(status);

  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: `${color}20` }}
    >
      <Text className="text-xs font-semibold" style={{ color }}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}
