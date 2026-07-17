import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import type { MediaPreviewItem } from "@/utils/media";
import { resolveMediaUrl } from "@/utils/media-url";
import { ZoomableImage } from "./ZoomableImage";
import { MediaVideoPlayer, PreviewVideoPoster } from "./MediaVideoPlayer";

interface MediaPreviewModalProps {
  visible: boolean;
  items: MediaPreviewItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaPreviewModal({
  visible,
  items,
  initialIndex = 0,
  onClose,
}: MediaPreviewModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<MediaPreviewItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= items.length) return;
    setCurrentIndex(index);
    setScrollEnabled(true);
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [items.length]);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    setScrollEnabled(true);
    setIsScrolling(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [visible, initialIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(index);
    setScrollEnabled(true);
    setIsScrolling(false);
  };

  const currentItem = items[currentIndex];
  const showImageHint = currentItem?.kind !== "video";
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;

  if (!visible || items.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-black">
          <View className="z-20 flex-row items-center justify-between px-5 py-4">
            <Pressable onPress={onClose} className="rounded-full bg-white/15 p-2">
              <X size={26} color="#fff" />
            </Pressable>

            <View className="flex-row items-center gap-3">
              {items.length > 1 ? (
                <Pressable
                  onPress={() => goToIndex(currentIndex - 1)}
                  disabled={!canGoPrev}
                  className="rounded-full bg-white/15 p-2"
                  style={{ opacity: canGoPrev ? 1 : 0.35 }}
                >
                  <ChevronLeft size={24} color="#fff" />
                </Pressable>
              ) : null}

              <Text className="rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white">
                {currentIndex + 1} / {items.length}
              </Text>

              {items.length > 1 ? (
                <Pressable
                  onPress={() => goToIndex(currentIndex + 1)}
                  disabled={!canGoNext}
                  className="rounded-full bg-white/15 p-2"
                  style={{ opacity: canGoNext ? 1 : 0.35 }}
                >
                  <ChevronRight size={24} color="#fff" />
                </Pressable>
              ) : null}
            </View>

            <View style={{ width: 42 }} />
          </View>

          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            scrollEnabled={scrollEnabled}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            windowSize={3}
            removeClippedSubviews
            style={{ flex: 1 }}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onScrollBeginDrag={() => setIsScrolling(true)}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ item, index }) => {
              const isActive = index === currentIndex;
              const showPlayer = item.kind === "video" && isActive && !isScrolling;

              return (
                <View
                  style={{
                    width: screenWidth,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  {item.kind === "video" ? (
                    showPlayer ? (
                      <MediaVideoPlayer uri={item.uri} />
                    ) : (
                      <PreviewVideoPoster uri={item.thumbnailUri ?? item.uri} />
                    )
                  ) : (
                    <ZoomableImage
                      uri={resolveMediaUrl(item.uri)}
                      onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
                    />
                  )}
                </View>
              );
            }}
          />

          {showImageHint ? (
            <View className="absolute bottom-6 left-0 right-0 items-center px-6">
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.82)",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    lineHeight: 18,
                  }}
                >
                  Arraste para o lado • Pinça ou toque duplo para zoom
                </Text>
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}
