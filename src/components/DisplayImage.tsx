import { useEffect, useState } from "react";
import {
  Image as RNImage,
  ActivityIndicator,
  View,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { colors } from "@/theme";

const uriCache = new Map<string, string>();

async function resolveImageUri(uri: string): Promise<string> {
  if (!uri) return uri;
  if (!uri.startsWith("data:")) return uri;

  const cacheKey = `${uri.length}:${uri.slice(0, 40)}`;
  const cached = uriCache.get(cacheKey);
  if (cached) return cached;

  const match = uri.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return uri;

  const mime = match[1];
  const base64 = match[2];
  const ext = mime.includes("png") ? "png" : "jpg";
  const fileUri = `${FileSystem.cacheDirectory}dhe-img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  uriCache.set(cacheKey, fileUri);
  return fileUri;
}

interface DisplayImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  onPress?: () => void;
}

export function DisplayImage({
  uri,
  style,
  resizeMode = "cover",
}: DisplayImageProps) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setFailed(false);
    setResolvedUri(null);

    resolveImageUri(uri)
      .then((result) => {
        if (mounted) setResolvedUri(result);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });

    return () => {
      mounted = false;
    };
  }, [uri]);

  if (failed) {
    return (
      <View
        style={[
          style,
          { backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="small" color={colors.textMuted} />
      </View>
    );
  }

  if (!resolvedUri) {
    return (
      <View
        style={[
          style,
          { backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <RNImage
      source={{ uri: resolvedUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
