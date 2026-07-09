import { useEffect, useRef } from "react";
import { Animated, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react-native";
import { useFeedbackStore } from "@/store/feedback";
import { colors } from "@/theme";

const toastStyles = {
  success: { bg: colors.success, icon: CheckCircle2 },
  error: { bg: colors.danger, icon: XCircle },
  warning: { bg: colors.warning, icon: AlertTriangle },
  info: { bg: colors.primary, icon: Info },
} as const;

export function AppToast() {
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useFeedbackStore();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: toast.visible ? 0 : -120,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [toast.visible, translateY]);

  if (!toast.visible) return null;

  const style = toastStyles[toast.type];
  const Icon = style.icon;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <Pressable onPress={hideToast}>
        <View
          className="flex-row items-center rounded-2xl px-4 py-4 shadow-lg"
          style={{ backgroundColor: style.bg }}
        >
          <Icon size={22} color={colors.bg} />
          <Text className="ml-3 flex-1 text-sm font-bold text-dhe-bg">{toast.message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
