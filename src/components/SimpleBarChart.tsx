import { View, Text } from "react-native";
import { colors } from "@/theme";

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartItem[];
  height?: number;
  barColor?: string;
}

export function SimpleBarChart({
  data,
  height = 180,
  barColor = colors.primary,
}: SimpleBarChartProps) {
  if (!data?.length) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-dhe-textMuted">Sem dados para exibir</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const chartHeight = height - 48;

  return (
    <View className="items-center">
      <View
        className="w-full flex-row items-end justify-center gap-2 px-1"
        style={{ height: chartHeight }}
      >
        {data.map((item) => {
          const barHeight = Math.max(2, (item.value / maxValue) * chartHeight);
          const fill = item.color ?? barColor;

          return (
            <View key={item.label} className="flex-1 items-center" style={{ maxWidth: 56 }}>
              <Text className="mb-1 text-[10px] font-semibold text-dhe-textSecondary">
                {item.value}
              </Text>
              <View
                className="w-full rounded-md"
                style={{ height: barHeight, backgroundColor: fill }}
              />
              <Text
                className="mt-2 text-center text-[10px] text-dhe-textMuted"
                numberOfLines={1}
              >
                {item.label.length > 8 ? `${item.label.slice(0, 7)}…` : item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
