import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import type { MediaPreviewItem } from "@/utils/media";
import { resolveMediaUrl } from "@/utils/media-url";
import { ZoomableImage } from "./ZoomableImage";
import { MediaVideoPlayer } from "./MediaVideoPlayer";

interface MediaPreviewModalProps {
  visible: boolean;
  items: MediaPreviewItem[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function MediaPreviewModal({
  visible,
  items,
  initialIndex = 0,
  onClose,
}: MediaPreviewModalProps) {
  const listRef = useRef<FlatList<MediaPreviewItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [visible, initialIndex]);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  if (!visible || items.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black">
        <View className="absolute right-4 top-4 z-20">
          <Pressable onPress={onClose} className="rounded-full bg-white/15 p-2">
            <X size={26} color="#fff" />
          </Pressable>
        </View>

        <View className="absolute left-0 right-0 top-4 z-20 items-center">
          <Text className="rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white">
            {currentIndex + 1} / {items.length}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item, index }) => (
            <View
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
                justifyContent: "center",
              }}
            >
              {item.kind === "video" ? (
                <MediaVideoPlayer uri={item.uri} active={index === currentIndex} />
              ) : (
                <ZoomableImage uri={resolveMediaUrl(item.uri)} />
              )}
            </View>
          )}
        />

        <View className="absolute bottom-6 left-0 right-0 items-center px-6">
          <Text className="text-center text-xs text-white/70">
            Arraste para o lado • Pinça ou toque duplo para zoom em fotos
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
