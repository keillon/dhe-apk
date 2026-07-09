import { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, Image, Modal, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { PenLine, PenTool, ZoomIn } from "lucide-react-native";
import { useSignatureStore } from "@/store";
import { colors } from "@/theme";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigatingRef = useRef(false);

  const isOpening = useSignatureStore((s) => s.isOpening);
  const setOpening = useSignatureStore((s) => s.setOpening);
  const consumePendingResult = useSignatureStore((s) => s.consumePendingResult);

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingResult();
      if (pending) {
        onChange(pending);
        setImageError(false);
      }
      navigatingRef.current = false;
      setOpening(false);
    }, [consumePendingResult, onChange, setOpening])
  );

  const handleOpen = useCallback(() => {
    if (navigatingRef.current || isOpening) return;

    navigatingRef.current = true;
    setOpening(true);

    router.push("/inspection/signature");
  }, [isOpening, router, setOpening]);

  const handleClear = () => {
    onChange(null);
    setImageError(false);
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <PenLine size={16} color={colors.primary} />
        <Text className="ml-2 text-sm font-bold text-dhe-text">Assinatura do cliente</Text>
      </View>

      {value && !imageError ? (
        <View className="overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
          <Pressable onPress={() => setPreviewOpen(true)}>
            <Image
              source={{ uri: value }}
              style={{
                height: 120,
                width: "100%",
                backgroundColor: colors.elevated,
              }}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 8,
                padding: 6,
              }}
            >
              <ZoomIn size={14} color="#fff" />
            </View>
          </Pressable>
          <View className="flex-row border-t border-dhe-border">
            <Pressable
              onPress={handleOpen}
              disabled={isOpening}
              className={`flex-1 items-center py-3 ${isOpening ? "opacity-50" : ""}`}
            >
              {isOpening ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text className="text-sm font-semibold text-dhe-primary">Refazer assinatura</Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleClear}
              disabled={isOpening}
              className={`flex-1 items-center border-l border-dhe-border py-3 ${
                isOpening ? "opacity-50" : ""
              }`}
            >
              <Text className="text-sm font-semibold text-dhe-danger">Remover</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={handleOpen}
          disabled={isOpening}
          className={`items-center rounded-2xl border border-dashed border-dhe-border bg-dhe-elevated py-8 ${
            isOpening ? "opacity-70" : ""
          }`}
        >
          {isOpening ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-3 text-base font-bold text-dhe-primary">Abrindo assinatura...</Text>
            </>
          ) : (
            <>
              <PenTool size={28} color={colors.primary} />
              <Text className="mt-3 text-base font-bold text-dhe-primary">Abrir tela de assinatura</Text>
              <Text className="mt-1 px-6 text-center text-xs text-dhe-textMuted">
                Abre em tela cheia no modo paisagem para assinar com mais espaço
              </Text>
            </>
          )}
        </Pressable>
      )}

      <Modal visible={previewOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreviewOpen(false)}
        >
          {value && (
            <Image
              source={{ uri: value }}
              style={{ width: "92%", height: "70%" }}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
