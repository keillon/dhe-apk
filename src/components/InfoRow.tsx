import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme";

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
}

export function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dhe-elevated">
        <Icon size={18} color={colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-medium text-dhe-textMuted">{label}</Text>
        <Text className="mt-1 text-base font-medium leading-5 text-dhe-text" numberOfLines={2}>
          {value?.trim() || "—"}
        </Text>
      </View>
    </View>
  );
}

interface InfoRowListProps {
  items: InfoRowProps[];
}

export function InfoRowList({ items }: InfoRowListProps) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={item.label}>
          <InfoRow {...item} />
          {index < items.length - 1 ? <View className="border-b border-dhe-border" /> : null}
        </View>
      ))}
    </View>
  );
}
