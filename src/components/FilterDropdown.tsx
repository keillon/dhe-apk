import { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SlidersHorizontal, X, Check } from "lucide-react-native";
import { Button } from "./Button";
import { colors } from "@/theme";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

export interface FilterGroup<T extends string> {
  key: string;
  title: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

interface FilterDropdownProps {
  groups: FilterGroup<string>[];
  activeCount: number;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 mr-2 flex-row items-center rounded-full px-4 py-2.5 ${
        active ? "bg-dhe-primary" : "bg-dhe-elevated"
      }`}
    >
      {active && <Check size={14} color={colors.bg} style={{ marginRight: 6 }} />}
      <Text className={`text-sm font-semibold ${active ? "text-dhe-bg" : "text-dhe-textSecondary"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterDropdown({ groups, activeCount }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center self-start rounded-2xl border border-dhe-border bg-dhe-card px-4 py-3"
      >
        <SlidersHorizontal size={18} color={colors.primary} />
        <Text className="ml-2 text-sm font-bold text-dhe-text">Filtros</Text>
        {activeCount > 0 && (
          <View className="ml-2 rounded-full bg-dhe-primary px-2 py-0.5">
            <Text className="text-xs font-bold text-dhe-bg">{activeCount}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[80%] rounded-t-3xl bg-dhe-surface px-5 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-dhe-text">Filtrar inspeções</Text>
              <Pressable onPress={() => setOpen(false)} className="rounded-full bg-dhe-elevated p-2">
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {groups.map((group) => (
                <View key={group.key} className="mb-5">
                  <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-dhe-textMuted">
                    {group.title}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {group.options.map((opt) => (
                      <FilterChip
                        key={opt.id}
                        label={opt.label}
                        active={group.value === opt.id}
                        onPress={() => group.onChange(opt.id)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <Button title="Aplicar filtros" fullWidth onPress={() => setOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
