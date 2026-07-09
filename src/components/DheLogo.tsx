import { Image } from "expo-image";
import { View } from "react-native";

interface DheLogoProps {
  variant?: "color" | "white";
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: 80, md: 140, lg: 200 };

export function DheLogo({ variant = "color", size = "md" }: DheLogoProps) {
  const width = SIZES[size];
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
