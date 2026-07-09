import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className={`mb-5 ${className ?? ""}`}>
      {label && (
        <Text className="mb-2 text-sm font-semibold text-dhe-textSecondary">{label}</Text>
      )}
      <TextInput
        className={`rounded-xl border bg-dhe-elevated px-4 py-4 text-base text-dhe-text ${
          error ? "border-dhe-danger" : "border-dhe-borderLight"
        }`}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text className="mt-2 text-sm text-dhe-danger">{error}</Text>}
    </View>
  );
}
