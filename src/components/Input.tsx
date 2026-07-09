import { Text, TextInput, View, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className={`mb-4 ${className ?? ""}`}>
      {label && (
        <Text className="mb-2 text-sm font-medium text-dhe-dark dark:text-dhe-light">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-xl border border-dhe-border bg-white px-4 py-4 text-base text-dhe-dark dark:border-dhe-muted dark:bg-dhe-dark dark:text-white ${
          error ? "border-red-500" : ""
        }`}
        placeholderTextColor="#5396B7"
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
