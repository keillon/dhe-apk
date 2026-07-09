import { useRef } from "react";
import { View, Text, Pressable, type LayoutChangeEvent, type GestureResponderEvent } from "react-native";
interface OilLevelSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function OilLevelSlider({ value, onChange }: OilLevelSliderProps) {
  const trackWidth = useRef(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (trackWidth.current <= 0) return;
    const x = e.nativeEvent.locationX;
    const pct = Math.round(Math.min(100, Math.max(0, (x / trackWidth.current) * 100)));
    onChange(pct);
  };

  return (
    <View>
      <Text className="mb-3 text-sm font-bold text-dhe-text">Nível do óleo: {value}%</Text>
      <Pressable
        onPress={handlePress}
        onLayout={handleLayout}
        className="h-12 justify-center rounded-2xl bg-dhe-elevated px-1"
      >
        <View className="h-4 overflow-hidden rounded-full bg-dhe-border">
          <View
            className="h-full rounded-full bg-dhe-primary"
            style={{ width: `${value}%` }}
          />
        </View>
        <View
          className="absolute h-7 w-7 rounded-full border-2 border-dhe-bg bg-dhe-primary"
          style={{
            left: `${value}%`,
            marginLeft: -14,
            top: "50%",
            marginTop: -14,
          }}
        />
      </Pressable>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-xs text-dhe-textMuted">0%</Text>
        <Text className="text-xs text-dhe-textMuted">100%</Text>
      </View>
      <View className="mt-3 flex-row gap-2">
        {[0, 25, 50, 75, 100].map((val) => (
          <Pressable
            key={val}
            onPress={() => onChange(val)}
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
