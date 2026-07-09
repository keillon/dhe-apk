import { useEffect, useRef } from "react";
import { View, Text, Pressable, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Trash2, Check } from "lucide-react-native";
import { useSignatureStore } from "@/store";
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
  const setResult = useSignatureStore((s) => s.setResult);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    setResult(`data:image/png;base64,${signature}`);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top", "bottom", "left", "right"]}>
      <StatusBar hidden />
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={handleClose} className="flex-row items-center rounded-xl bg-dhe-card px-4 py-2">
          <X size={18} color={colors.text} />
          <Text className="ml-2 text-sm font-semibold text-dhe-text">Cancelar</Text>
        </Pressable>
        <Text className="text-base font-bold text-dhe-text">Assinatura do cliente</Text>
        <View className="w-24" />
      </View>

      <View className="mx-4 mb-3 flex-1 overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
        <SignatureCanvas
          ref={ref}
          onOK={handleOK}
          onEmpty={() => {}}
          webStyle={signatureWebStyle}
          backgroundColor={colors.elevated}
          penColor={colors.text}
          descriptionText="Assine na área abaixo"
          clearText=""
          confirmText=""
          autoClear={false}
          style={{ flex: 1 }}
        />
      </View>

      <View className="flex-row gap-3 px-4 pb-4">
        <Pressable
          onPress={handleClear}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-card py-4"
        >
          <Trash2 size={18} color={colors.textMuted} />
          <Text className="ml-2 text-sm font-bold text-dhe-textSecondary">Limpar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-primary py-4"
        >
          <Check size={18} color={colors.bg} />
          <Text className="ml-2 text-sm font-bold text-dhe-bg">Confirmar assinatura</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
