import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Inbox } from "lucide-react-native";
import { Button } from "./Button";

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
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 rounded-full bg-dhe-surface p-6">
        <Icon size={48} color="#7CBFE0" />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-dhe-dark dark:text-white">
        {title}
      </Text>
      {description && (
        <Text className="mb-6 text-center text-base text-dhe-muted">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" />
      )}
    </View>
  );
}
