import Svg, { Rect, Text as SvgText } from "react-native-svg";
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
  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-dhe-textMuted">Sem dados para exibir</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const chartWidth = 320;
  const barGap = 12;
  const barWidth = Math.max(24, (chartWidth - barGap * (data.length + 1)) / data.length);
  const chartHeight = height - 40;

  return (
    <View className="items-center">
      <Svg width={chartWidth} height={height}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = barGap + index * (barWidth + barGap);
          const y = chartHeight - barHeight + 8;
          const fill = item.color ?? barColor;

          return (
            <Rect
              key={item.label}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={6}
              fill={fill}
            />
          );
        })}
        {data.map((item, index) => {
          const x = barGap + index * (barWidth + barGap) + barWidth / 2;
          return (
            <SvgText
              key={`${item.label}-label`}
              x={x}
              y={height - 8}
              fill={colors.textMuted}
              fontSize={10}
              textAnchor="middle"
            >
              {item.label.length > 8 ? `${item.label.slice(0, 7)}…` : item.label}
            </SvgText>
          );
        })}
      </Svg>
      <View className="mt-2 flex-row flex-wrap justify-center gap-3">
        {data.map((item) => (
          <Text key={`${item.label}-value`} className="text-xs text-dhe-textSecondary">
            {item.label}: {item.value}
          </Text>
        ))}
      </View>
    </View>
  );
}
