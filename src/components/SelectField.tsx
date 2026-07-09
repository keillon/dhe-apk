import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown, Check, X } from "lucide-react-native";
import { colors } from "@/theme";

export interface SelectOption<T extends string> {
  id: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecione...",
  error,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.id === value);

  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold text-dhe-textSecondary">{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between rounded-xl border bg-dhe-elevated px-4 py-4 ${
          error ? "border-dhe-danger" : "border-dhe-borderLight"
        }`}
      >
        <Text className={`text-base ${selected ? "text-dhe-text" : "text-dhe-textMuted"}`}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      {error && <Text className="mt-2 text-sm text-dhe-danger">{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[70%] rounded-t-3xl bg-dhe-surface px-5 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-dhe-text">{label}</Text>
              <Pressable onPress={() => setOpen(false)} className="rounded-full bg-dhe-elevated p-2">
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.id === value;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className={`mb-2 flex-row items-center justify-between rounded-2xl px-4 py-4 ${
                      active ? "bg-dhe-primary/20" : "bg-dhe-elevated"
                    }`}
                  >
                    <Text
                      className={`text-base ${active ? "font-bold text-dhe-primary" : "text-dhe-text"}`}
                    >
                      {option.label}
                    </Text>
                    {active && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
