import { useState } from "react";
import { Text, TextInput, View, Pressable, Platform, Modal } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar, CalendarDays } from "lucide-react-native";
import { format } from "date-fns";
import { maskDateInput, isValidDateBR } from "@/utils/masks";
import { colors } from "@/theme";

interface DateInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

function parseDateBR(value: string): Date | null {
  if (!isValidDateBR(value)) return null;
  const [day, month, year] = value.split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateBR(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

export function DateInput({ label, value, onChangeText, error }: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerDate = parseDateBR(value) ?? new Date();

  const handleToday = () => {
    onChangeText(formatDateBR(new Date()));
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "dismissed" || !selected) return;
    onChangeText(formatDateBR(selected));
  };

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
      />

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={handleToday}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-primary py-3"
        >
          <CalendarDays size={16} color={colors.bg} />
          <Text className="ml-2 text-sm font-bold text-dhe-bg">Hoje</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-elevated py-3"
        >
          <Calendar size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Escolher data</Text>
        </Pressable>
      </View>

      {error && <Text className="mt-2 text-sm text-dhe-danger">{error}</Text>}

      {Platform.OS === "ios" ? (
        <Modal visible={showPicker} transparent animationType="slide">
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setShowPicker(false)}
          >
            <Pressable className="rounded-t-3xl bg-dhe-card p-4" onPress={(e) => e.stopPropagation()}>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-dhe-text">Selecionar data</Text>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text className="text-sm font-semibold text-dhe-primary">Concluir</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                locale="pt-BR"
                themeVariant="dark"
                onChange={handlePickerChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            onChange={handlePickerChange}
          />
        )
      )}
    </View>
  );
}
