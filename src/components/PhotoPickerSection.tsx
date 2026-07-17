import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Camera, ImagePlus, Video, X, ZoomIn } from "lucide-react-native";
import { feedback } from "@/services/feedback";
import { DisplayImage } from "./DisplayImage";
import { MediaPreviewModal } from "./MediaPreviewModal";
import { VideoRecordModal } from "./VideoRecordModal";
import { VideoThumbnail } from "./VideoThumbnail";
import { colors } from "@/theme";
import {
  pickFromGallery,
  captureMultipleFromCamera,
  getPhotoPreviewUri,
  getVideoPlaybackUri,
  pickVideoFromGallery,
  type LocalPhoto,
} from "@/utils/images";
import { localPhotosToPreviewItems } from "@/utils/media";
import {
  createLocalVideoFromUri,
  getLocalMediaThumbUri,
} from "@/utils/video";

interface PhotoPickerSectionProps {
  fotosAntes: LocalPhoto[];
  fotosDepois: LocalPhoto[];
  onChangeAntes: (photos: LocalPhoto[]) => void;
  onChangeDepois: (photos: LocalPhoto[]) => void;
  errorAntes?: string;
  errorDepois?: string;
}

const THUMB_SIZE = 96;
const MAX_ITEMS = 10;

function PhotoGrid({
  title,
  photos,
  onChange,
  accentColor,
  error,
}: {
  title: string;
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  accentColor: string;
  error?: string;
}) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);

  const previewItems = localPhotosToPreviewItems(
    photos.map((photo) => ({
      uri: photo.kind === "video" ? getVideoPlaybackUri(photo) : getPhotoPreviewUri(photo),
      kind: photo.kind,
      thumbnailUri: photo.thumbnailUri,
    }))
  );

  const addFromGallery = async () => {
    const picked = await pickFromGallery(photos.length);
    if (picked.length > 0) onChange([...photos, ...picked]);
  };

  const addFromCamera = async () => {
    if (capturing) return;
    setCapturing(true);

    try {
      let acc = [...photos];
      await captureMultipleFromCamera(photos.length, (photo) => {
        acc = [...acc, photo];
        onChange(acc);
      });
    } finally {
      setCapturing(false);
    }
  };

  const addVideoFromGallery = async () => {
    const video = await pickVideoFromGallery(photos.length);
    if (video) onChange([...photos, video]);
  };

  const addVideoFromCamera = () => {
    setShowVideoRecorder(true);
  };

  const handleVideoRecorded = async (uri: string, withAudio: boolean) => {
    try {
      const video = await createLocalVideoFromUri(uri, withAudio);
      onChange([...photos, video]);
    } catch (error) {
      if (error instanceof Error && error.message === "VIDEO_TOO_LARGE") {
        await feedback.alert(
          "Vídeo muito grande",
          "Grave um vídeo mais curto. O limite é cerca de 20 MB."
        );
        return;
      }
      await feedback.alert("Erro", "Não foi possível processar o vídeo gravado.");
    }
  };

  const removePhoto = async (index: number) => {
    const confirmed = await feedback.confirm("Remover mídia", "Deseja remover este item?", "Remover");
    if (confirmed) onChange(photos.filter((_, i) => i !== index));
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const atLimit = photos.length >= MAX_ITEMS;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-bold" style={{ color: accentColor }}>
          {title} *
        </Text>
        <Text className="text-xs text-dhe-textMuted">
          {photos.length}/{MAX_ITEMS}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
        nestedScrollEnabled
        contentContainerStyle={{ paddingTop: 6, paddingRight: 6 }}
      >
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} style={{ marginRight: 8 }}>
            <Pressable onPress={() => openPreview(index)}>
              <View
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {photo.kind === "video" ? (
                  <VideoThumbnail uri={getLocalMediaThumbUri(photo)} size={THUMB_SIZE} borderRadius={0} />
                ) : (
                  <DisplayImage
                    uri={getPhotoPreviewUri(photo)}
                    style={{
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                    }}
                    resizeMode="cover"
                  />
                )}
                <View
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: 8,
                    padding: 4,
                  }}
                >
                  {photo.kind === "video" ? (
                    <Video size={10} color="#fff" />
                  ) : (
                    <ZoomIn size={10} color="#fff" />
                  )}
                </View>
                {photo.kind === "video" && photo.withAudio === false ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderRadius: 6,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 8, fontWeight: "700" }}>MUDO</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>

            <Pressable
              onPress={(event) => {
                event.stopPropagation?.();
                void removePhoto(index);
              }}
              hitSlop={6}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.danger,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.bg,
              }}
            >
              <X size={12} color="#fff" />
            </Pressable>
          </View>
        ))}

        {photos.length === 0 && (
          <View
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: 12,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: error ? colors.danger : colors.border,
              backgroundColor: colors.elevated,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
          >
            <ImagePlus size={24} color={colors.textMuted} />
          </View>
        )}
      </ScrollView>

      {error ? <Text className="mb-2 text-sm text-dhe-danger">{error}</Text> : null}

      <View className="flex-row gap-2">
        <Pressable
          onPress={addFromCamera}
          disabled={capturing || atLimit}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            capturing || atLimit ? "bg-dhe-card opacity-50" : "bg-dhe-elevated"
          }`}
        >
          <Camera size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">
            {capturing ? "Abrindo..." : "Fotos"}
          </Text>
        </Pressable>
        <Pressable
          onPress={addFromGallery}
          disabled={atLimit}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            atLimit ? "bg-dhe-card opacity-50" : "bg-dhe-elevated"
          }`}
        >
          <ImagePlus size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Galeria</Text>
        </Pressable>
      </View>

      <View className="mt-2 flex-row gap-2">
        <Pressable
          onPress={addVideoFromCamera}
          disabled={atLimit}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            atLimit ? "bg-dhe-card opacity-50" : "bg-dhe-elevated"
          }`}
        >
          <Video size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Gravar vídeo</Text>
        </Pressable>
        <Pressable
          onPress={addVideoFromGallery}
          disabled={atLimit}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            atLimit ? "bg-dhe-card opacity-50" : "bg-dhe-elevated"
          }`}
        >
          <Video size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-semibold text-dhe-primary">Vídeo galeria</Text>
        </Pressable>
      </View>

      <MediaPreviewModal
        visible={previewVisible}
        items={previewItems}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />

      <VideoRecordModal
        visible={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onRecorded={(uri, withAudio) => void handleVideoRecorded(uri, withAudio)}
      />
    </View>
  );
}

export function PhotoPickerSection({
  fotosAntes,
  fotosDepois,
  onChangeAntes,
  onChangeDepois,
  errorAntes,
  errorDepois,
}: PhotoPickerSectionProps) {
  return (
    <View>
      <Text className="mb-1 text-sm font-bold text-dhe-text">Fotos e vídeos *</Text>
      <Text className="mb-3 text-xs text-dhe-textMuted">
        Obrigatório: pelo menos 1 foto ou vídeo em Antes. Depois é opcional. Até {MAX_ITEMS} mídias por seção.
      </Text>
      <PhotoGrid
        title="Antes *"
        photos={fotosAntes}
        onChange={onChangeAntes}
        accentColor={colors.warning}
        error={errorAntes}
      />
      <PhotoGrid
        title="Depois (opcional)"
        photos={fotosDepois}
        onChange={onChangeDepois}
        accentColor={colors.success}
        error={errorDepois}
      />
    </View>
  );
}
