import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { PenLine } from "lucide-react-native";
import type { InspectionPhoto } from "@/types";
import { DisplayImage } from "./DisplayImage";
import { MediaPreviewModal } from "./MediaPreviewModal";
import { VideoThumbnail } from "./VideoThumbnail";
import { resolveMediaUrl } from "@/utils/media-url";
import { inferMediaKind, type MediaPreviewItem } from "@/utils/media";
import { generateVideoThumbnail } from "@/utils/video";
import { colors } from "@/theme";

const THUMB_SIZE = 88;

interface InspectionGalleryProps {
  fotos?: InspectionPhoto[];
  assinaturaUrl?: string;
}

function RemoteVideoThumb({ uri, size }: { uri: string; size: number }) {
  const [thumbnailUri, setThumbnailUri] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    void generateVideoThumbnail(uri).then((thumb) => {
      if (active && thumb) setThumbnailUri(thumb);
    });
    return () => {
      active = false;
    };
  }, [uri]);

  return <VideoThumbnail uri={thumbnailUri ?? uri} size={size} />;
}

function MediaThumb({
  uri,
  kind,
  onPress,
}: {
  uri: string;
  kind: "image" | "video";
  onPress: () => void;
}) {
  const resolved = resolveMediaUrl(uri);

  return (
    <Pressable onPress={onPress} style={{ marginRight: 8, marginBottom: 8 }}>
      {kind === "video" ? (
        <RemoteVideoThumb uri={resolved} size={THUMB_SIZE} />
      ) : (
        <DisplayImage
          uri={resolved}
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  );
}

function buildGalleryItems(fotos: InspectionPhoto[]): MediaPreviewItem[] {
  return fotos.map((photo) => ({
    id: String(photo.id),
    uri: photo.url,
    kind: inferMediaKind(photo.url, photo.media_kind),
  }));
}

export function InspectionGallery({ fotos = [], assinaturaUrl }: InspectionGalleryProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [signaturePreview, setSignaturePreview] = useState(false);

  const allItems = useMemo(() => buildGalleryItems(fotos), [fotos]);
  const antes = fotos.filter((f) => f.tipo === "antes");
  const depois = fotos.filter((f) => f.tipo === "depois");

  const openPreview = (photo: InspectionPhoto) => {
    const index = allItems.findIndex((item) => item.id === String(photo.id));
    setPreviewIndex(index >= 0 ? index : 0);
    setPreviewVisible(true);
  };

  const renderPhotoGrid = (title: string, photos: InspectionPhoto[], accent: string) => {
    if (photos.length === 0) return null;

    return (
      <View className="mb-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
          {title} ({photos.length})
        </Text>
        <View className="flex-row flex-wrap">
          {photos.map((photo) => (
            <MediaThumb
              key={photo.id}
              uri={photo.url}
              kind={inferMediaKind(photo.url, photo.media_kind)}
              onPress={() => openPreview(photo)}
            />
          ))}
        </View>
      </View>
    );
  };

  const signatureItem: MediaPreviewItem[] = assinaturaUrl
    ? [{ id: "signature", uri: assinaturaUrl, kind: "image" }]
    : [];

  return (
    <View>
      {renderPhotoGrid("Antes", antes, colors.warning)}
      {renderPhotoGrid("Depois", depois, colors.success)}

      {assinaturaUrl ? (
        <View>
          <View className="mb-2 flex-row items-center">
            <PenLine size={14} color={colors.primary} />
            <Text className="ml-1 text-xs font-bold uppercase tracking-wide text-dhe-primary">
              Assinatura do técnico
            </Text>
          </View>
          <Pressable onPress={() => setSignaturePreview(true)}>
            <DisplayImage
              uri={resolveMediaUrl(assinaturaUrl)}
              style={{
                height: 110,
                width: "100%",
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      ) : null}

      {!fotos.length && !assinaturaUrl ? (
        <Text className="text-sm text-dhe-textMuted">Nenhuma mídia disponível para exibir.</Text>
      ) : null}

      <MediaPreviewModal
        visible={previewVisible}
        items={allItems}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />

      <MediaPreviewModal
        visible={signaturePreview}
        items={signatureItem}
        initialIndex={0}
        onClose={() => setSignaturePreview(false)}
      />
    </View>
  );
}
