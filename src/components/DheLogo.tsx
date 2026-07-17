import { Image } from "expo-image";
import { View } from "react-native";

interface DheLogoProps {
  variant?: "color" | "white" | "mark";
  size?: "sm" | "md" | "lg";
}

const WORDMARK_SIZES = { sm: 80, md: 140, lg: 200 };
const MARK_SIZES = { sm: 40, md: 64, lg: 96 };

export function DheLogo({ variant = "color", size = "md" }: DheLogoProps) {
  if (variant === "mark") {
    const side = MARK_SIZES[size];
    return (
      <View className="items-center">
        <Image
          source={require("../../assets/adaptive-icon.png")}
          style={{ width: side, height: side, borderRadius: side * 0.22 }}
          contentFit="cover"
        />
      </View>
    );
  }

  const width = WORDMARK_SIZES[size];
  const height = width * 0.35;

  return (
    <View className="items-center">
      <Image
        source={
          variant === "white"
            ? require("../../assets/logo-dhe-white.webp")
            : require("../../assets/logo-dhe.webp")
        }
        style={{ width, height }}
        contentFit="contain"
      />
    </View>
  );
}
