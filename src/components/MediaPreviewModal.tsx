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
  type ViewToken,
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
  const settlingRef = useRef(false);

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, Math.max(items.length - 1, 0))),
    [items.length]
  );

  const scrollToIndexSafe = useCallback(
    (index: number, animated: boolean) => {
      const next = clampIndex(index);
      settlingRef.current = true;
      requestAnimationFrame(() => {
        try {
          listRef.current?.scrollToOffset({
            offset: next * screenWidth,
            animated,
          });
        } catch {
          // ignore layout race
        }
        setTimeout(() => {
          settlingRef.current = false;
        }, animated ? 280 : 50);
      });
    },
    [clampIndex, screenWidth]
  );

  const goToIndex = useCallback(
    (index: number) => {
      const next = clampIndex(index);
      setCurrentIndex(next);
      setScrollEnabled(true);
      scrollToIndexSafe(next, true);
    },
    [clampIndex, scrollToIndexSafe]
  );

  useEffect(() => {
    if (!visible) return;
    const start = clampIndex(initialIndex);
    setCurrentIndex(start);
    setScrollEnabled(true);
    scrollToIndexSafe(start, false);
  }, [visible, initialIndex, clampIndex, scrollToIndexSafe, items.length]);

  const snapToNearest = useCallback(
    (offsetX: number) => {
      const raw = offsetX / screenWidth;
      const next = clampIndex(Math.round(raw));
      setCurrentIndex(next);
      setScrollEnabled(true);
      const expected = next * screenWidth;
      if (Math.abs(offsetX - expected) > 1) {
        scrollToIndexSafe(next, true);
      }
    },
    [clampIndex, screenWidth, scrollToIndexSafe]
  );

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (settlingRef.current) return;
    snapToNearest(event.nativeEvent.contentOffset.x);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index == null || settlingRef.current) return;
      setCurrentIndex(first.index);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const currentItem = items[currentIndex];
  const showImageHint = currentItem?.kind !== "video";
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;

  if (!visible || items.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top", "bottom"]}>
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
            bounces={false}
            overScrollMode="never"
            scrollEnabled={scrollEnabled}
            showsHorizontalScrollIndicator={false}
            disableIntervalMomentum
            decelerationRate="fast"
            snapToInterval={screenWidth}
            snapToAlignment="start"
            disableScrollViewPanResponder={false}
            style={{ flex: 1, width: screenWidth }}
            contentContainerStyle={{ alignItems: "stretch" }}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollEndDrag={(event) => {
              // Se o gesto parar sem momentum (ex.: soltou no meio), força o snap.
              const velocity = event.nativeEvent.velocity?.x ?? 0;
              if (Math.abs(velocity) < 0.05) {
                snapToNearest(event.nativeEvent.contentOffset.x);
              }
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            removeClippedSubviews={false}
            renderItem={({ item, index }) => {
              const isActive = index === currentIndex;

              return (
                <View
                  style={{
                    width: screenWidth,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#000",
                  }}
                >
                  {item.kind === "video" ? (
                    isActive ? (
                      <MediaVideoPlayer uri={item.uri} />
                    ) : (
                      <PreviewVideoPoster uri={item.thumbnailUri ?? item.uri} />
                    )
                  ) : (
                    <ZoomableImage
                      key={`${item.id}-${isActive ? "active" : "idle"}`}
                      uri={resolveMediaUrl(item.uri)}
                      enabled={isActive}
                      onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
                    />
                  )}
                </View>
              );
            }}
          />

          {showImageHint ? (
            <View className="absolute bottom-8 left-0 right-0 items-center px-6">
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
