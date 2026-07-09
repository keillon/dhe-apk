import { Text, TextInput, View, type TextInputProps } from "react-native";
import { maskDateInput } from "@/utils/masks";
import { colors } from "@/theme";

interface DateInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export function DateInput({ label, value, onChangeText, error, ...props }: DateInputProps) {
  return (
    <View className="mb-5">
      {label && (
        <Text className="mb-2 text-sm font-semibold text-dhe-textSecondary">{label}</Text>
      )}
      <TextInput
        className={`rounded-xl border bg-dhe-elevated px-4 py-4 text-base text-dhe-text ${
          error ? "border-dhe-danger" : "border-dhe-borderLight"
        }`}
        placeholder="DD/MM/AAAA"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={10}
        value={value}
        onChangeText={(text) => onChangeText(maskDateInput(text))}
        {...props}
      />
      {error && <Text className="mt-2 text-sm text-dhe-danger">{error}</Text>}
    </View>
  );
}
