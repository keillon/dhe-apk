import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ZoomableImageProps {
  uri: string;
  enabled?: boolean;
  onZoomChange?: (zoomed: boolean) => void;
}

export function ZoomableImage({ uri, enabled = true, onZoomChange }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const emitZoom = (zoomed: boolean) => {
    onZoomChange?.(zoomed);
  };

  const resetZoom = () => {
    "worklet";
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    runOnJS(emitZoom)(false);
  };

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onZoomChange?.(false);
    // Reset only when the media page changes / becomes inactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, enabled]);

  const pinch = Gesture.Pinch()
    .enabled(enabled)
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
      if (scale.value > 1.05) {
        runOnJS(emitZoom)(true);
      }
    })
    .onEnd(() => {
      if (scale.value <= 1.05) {
        resetZoom();
      } else {
        savedScale.value = scale.value;
        runOnJS(emitZoom)(true);
      }
    });

  const pan = Gesture.Pan()
    .enabled(enabled)
    .averageTouches(true)
    .manualActivation(true)
    .onTouchesMove((_, state) => {
      if (scale.value > 1.05) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .enabled(enabled)
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
        return;
      }

      scale.value = withTiming(2.5);
      savedScale.value = 2.5;
      runOnJS(emitZoom)(true);
    });

  const gesture = Gesture.Simultaneous(pinch, Gesture.Exclusive(pan, doubleTap));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container} collapsable={false}>
        <Animated.Image source={{ uri }} style={[styles.image, animatedStyle]} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
