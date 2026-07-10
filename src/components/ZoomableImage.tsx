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
  onZoomChange?: (zoomed: boolean) => void;
}

export function ZoomableImage({ uri, onZoomChange }: ZoomableImageProps) {
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

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      runOnJS(emitZoom)(true);
    })
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      if (scale.value <= 1.01) {
        resetZoom();
      } else {
        savedScale.value = scale.value;
        runOnJS(emitZoom)(true);
      }
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_, state) => {
      if (scale.value > 1) {
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

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container}>
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
