import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play } from "lucide-react-native";
import { resolveMediaUrl } from "@/utils/media-url";

interface MediaVideoPlayerProps {
  uri: string;
}

export function MediaVideoPlayer({ uri }: MediaVideoPlayerProps) {
  const source = resolveMediaUrl(uri);

  const player = useVideoPlayer(source || null, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  if (!source) return null;

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      nativeControls
      contentFit="contain"
    />
  );
}

interface PreviewVideoPosterProps {
  uri: string;
}

export function PreviewVideoPoster({ uri }: PreviewVideoPosterProps) {
  const resolved = resolveMediaUrl(uri);

  if (!resolved) return null;

  return (
    <View style={styles.poster}>
      <Image source={{ uri: resolved }} style={styles.posterImage} contentFit="contain" />
      <View style={styles.posterOverlay}>
        <View style={styles.playBadge}>
          <Play size={28} color="#fff" fill="#fff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  posterOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
