import { Modal, Pressable, Text, View } from "react-native";
import { useFeedbackStore } from "@/store/feedback";
import { colors } from "@/theme";

export function AppDialog() {
  const { dialog, resolveDialog } = useFeedbackStore();

  if (!dialog.visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => resolveDialog("cancel")}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: colors.overlay }}
        onPress={() => resolveDialog("cancel")}
      >
        <Pressable
          className="w-full max-w-md overflow-hidden rounded-3xl bg-dhe-card"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="border-b border-dhe-border px-5 py-5">
            <Text className="text-lg font-bold text-dhe-text">{dialog.title}</Text>
            <Text className="mt-2 text-sm leading-6 text-dhe-textSecondary">{dialog.message}</Text>
          </View>

          <View className="gap-2 p-4">
            {dialog.buttons.map((button) => {
              const isPrimary = button.style === "primary";
              const isDestructive = button.style === "destructive";
              const isCancel = button.style === "cancel";

              return (
                <Pressable
                  key={button.value}
                  onPress={() => resolveDialog(button.value)}
                  className={`items-center rounded-2xl py-4 ${
                    isPrimary
                      ? "bg-dhe-primary"
                      : isDestructive
                        ? "bg-dhe-danger"
                        : "bg-dhe-elevated"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isPrimary || isDestructive ? "text-dhe-bg" : "text-dhe-text"
                    } ${isCancel ? "text-dhe-textMuted" : ""}`}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
