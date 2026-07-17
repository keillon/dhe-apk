import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, StatusBar, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Trash2, Check } from "lucide-react-native";
import { useSignatureStore } from "@/store";
import { feedback } from "@/services/feedback";
import { normalizeSignatureDataUrl } from "@/utils/signature";
import { colors } from "@/theme";

const signatureWebStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: none;
    margin: 0;
    width: 100%;
    height: 100%;
  }
  .m-signature-pad--body {
    border: none;
    margin: 0;
  }
  .m-signature-pad--footer {
    display: none;
    margin: 0;
  }
  body, html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    touch-action: none;
  }
  canvas {
    touch-action: none;
  }
`;

export default function SignatureScreen() {
  const router = useRouter();
  const ref = useRef<SignatureViewRef>(null);
  const savingRef = useRef(false);

  const setPendingResult = useSignatureStore((s) => s.setPendingResult);

  const [canvasReady, setCanvasReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      savingRef.current = false;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (savingRef.current) return;
    router.back();
  }, [router]);

  const handleClear = useCallback(() => {
    if (savingRef.current) return;
    ref.current?.clearSignature();
    setHasDrawn(false);
  }, []);

  const finishWithError = useCallback((message: string) => {
    savingRef.current = false;
    setSaving(false);
    feedback.toast.warning(message);
  }, []);

  const handleConfirm = useCallback(() => {
    if (savingRef.current || saving || !canvasReady) return;

    if (!hasDrawn) {
      feedback.toast.warning("Desenhe a assinatura antes de confirmar.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    ref.current?.readSignature();
  }, [canvasReady, hasDrawn, saving]);

  const handleOK = useCallback(
    (signature: string) => {
      if (!savingRef.current) return;

      const dataUrl = normalizeSignatureDataUrl(signature);
      if (!dataUrl) {
        finishWithError("Não foi possível capturar a assinatura. Tente novamente.");
        return;
      }

      setPendingResult(dataUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      feedback.toast.success("Assinatura confirmada");
      router.back();
    },
    [finishWithError, router, setPendingResult]
  );

  const handleEmpty = useCallback(() => {
    finishWithError("A assinatura está vazia. Desenhe antes de confirmar.");
  }, [finishWithError]);

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top", "bottom", "left", "right"]}>
      <StatusBar hidden />
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={handleClose}
          disabled={saving}
          className={`flex-row items-center rounded-xl bg-dhe-card px-4 py-2 ${saving ? "opacity-50" : ""}`}
        >
          <X size={18} color={colors.text} />
          <Text className="ml-2 text-sm font-semibold text-dhe-text">Cancelar</Text>
        </Pressable>
        <Text className="text-base font-bold text-dhe-text">Assinatura do técnico</Text>
        <View className="w-24" />
      </View>

      <View className="mx-4 mb-3 flex-1 overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
        {!canvasReady && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.elevated,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-3 text-sm text-dhe-textMuted">Preparando área de assinatura...</Text>
          </View>
        )}
        <SignatureCanvas
          ref={ref}
          onOK={handleOK}
          onEmpty={handleEmpty}
          onBegin={() => setHasDrawn(true)}
          onLoadEnd={() => setCanvasReady(true)}
          webStyle={signatureWebStyle}
          backgroundColor={colors.elevated}
          penColor={colors.text}
          descriptionText="Assine na área abaixo"
          clearText=""
          confirmText=""
          autoClear={false}
          nestedScrollEnabled={false}
          trimWhitespace
          imageType="image/png"
          style={{ flex: 1 }}
        />
      </View>

      <View className="flex-row gap-3 px-4 pb-4">
        <Pressable
          onPress={handleClear}
          disabled={saving || !canvasReady}
          className={`flex-1 flex-row items-center justify-center rounded-xl bg-dhe-card py-4 ${
            saving || !canvasReady ? "opacity-50" : ""
          }`}
        >
          <Trash2 size={18} color={colors.textMuted} />
          <Text className="ml-2 text-sm font-bold text-dhe-textSecondary">Limpar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={saving || !canvasReady}
          className={`flex-1 flex-row items-center justify-center rounded-xl bg-dhe-primary py-4 ${
            saving || !canvasReady ? "opacity-50" : ""
          }`}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Check size={18} color={colors.bg} />
          )}
          <Text className="ml-2 text-sm font-bold text-dhe-bg">
            {saving ? "Salvando..." : "Confirmar assinatura"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
