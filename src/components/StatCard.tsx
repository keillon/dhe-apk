import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, color = "#0073FF" }: StatCardProps) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4 shadow-dhe dark:bg-dhe-dark">
      <View
        className="mb-3 h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-dhe-dark dark:text-white">{value}</Text>
      <Text className="mt-1 text-xs text-dhe-muted">{label}</Text>
    </View>
  );
}
