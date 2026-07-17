import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, color = "#0172FE" }: StatCardProps) {
  return (
    <View className="flex-1 rounded-2xl border border-dhe-border bg-dhe-card p-6">
      <View
        className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}25` }}
      >
        <Icon size={22} color={color} />
      </View>
      <Text className="text-3xl font-bold text-dhe-text">{value}</Text>
      <Text className="mt-1 text-sm font-medium text-dhe-textSecondary">{label}</Text>
    </View>
  );
}
