import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { colors } from "@/theme";
import { resolveMediaUrl } from "@/utils/media-url";

interface VideoThumbnailProps {
  uri: string;
  size: number;
  borderRadius?: number;
}

export function VideoThumbnail({ uri, size, borderRadius = 12 }: VideoThumbnailProps) {
  const resolved = resolveMediaUrl(uri);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: "hidden",
        backgroundColor: colors.elevated,
      }}
    >
      <Image
        source={{ uri: resolved }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View style={styles.playOverlay}>
        <Play size={size * 0.28} color="#fff" fill="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
});
