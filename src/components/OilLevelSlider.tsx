import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { colors } from "@/theme";

interface OilLevelSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function clampOilLevel(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function OilLevelSlider({ value, onChange }: OilLevelSliderProps) {
  const [manualText, setManualText] = useState(String(value));

  useEffect(() => {
    setManualText(String(value));
  }, [value]);

  const applyManualValue = (text: string) => {
    setManualText(text);
    if (text === "") return;

    const parsed = Number(text.replace(/\D/g, ""));
    if (!Number.isNaN(parsed)) {
      onChange(clampOilLevel(parsed));
    }
  };

  const handleSliderChange = (next: number) => {
    const clamped = clampOilLevel(next);
    onChange(clamped);
    setManualText(String(clamped));
  };

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-dhe-text">Nível do óleo</Text>
        <View className="flex-row items-center rounded-xl border border-dhe-border bg-dhe-card px-3 py-2">
          <TextInput
            className="min-w-[40px] text-center text-base font-bold text-dhe-primary"
            keyboardType="number-pad"
            maxLength={3}
            value={manualText}
            onChangeText={applyManualValue}
            onBlur={() => setManualText(String(value))}
            selectTextOnFocus
          />
          <Text className="text-base font-bold text-dhe-primary">%</Text>
        </View>
      </View>

      <Slider
        value={value}
        onValueChange={handleSliderChange}
        minimumValue={0}
        maximumValue={100}
        step={1}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        style={{ width: "100%", height: 40 }}
      />

      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs text-dhe-textMuted">0%</Text>
        <Text className="text-xs text-dhe-textMuted">100%</Text>
      </View>

      <View className="mt-2 flex-row gap-2">
        {[0, 25, 50, 75, 100].map((val) => (
          <Pressable
            key={val}
            onPress={() => handleSliderChange(val)}
            className={`flex-1 items-center rounded-xl py-2 ${
              value === val ? "bg-dhe-primary" : "bg-dhe-card"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                value === val ? "text-dhe-bg" : "text-dhe-textSecondary"
              }`}
            >
              {val}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
