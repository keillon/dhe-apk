import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Inbox } from "lucide-react-native";
import { Button } from "./Button";
import { colors } from "@/theme";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <View className="mb-5 rounded-full border border-dhe-border bg-dhe-card p-6">
        <Icon size={48} color={colors.primary} />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-dhe-text">{title}</Text>
      {description && (
        <Text className="mb-6 text-center text-base leading-6 text-dhe-textSecondary">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" />
      )}
    </View>
  );
}
