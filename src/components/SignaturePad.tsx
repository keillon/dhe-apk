import { useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";
import { Image } from "expo-image";
import { PenLine, Trash2 } from "lucide-react-native";
import { colors } from "@/theme";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

const signatureWebStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: none;
    margin: 0;
  }
  .m-signature-pad--body {
    border: none;
    border-radius: 12px;
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
  }
`;

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const ref = useRef<SignatureViewRef>(null);
  const [editing, setEditing] = useState(!value);

  const handleOK = (signature: string) => {
    onChange(`data:image/png;base64,${signature}`);
    setEditing(false);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    onChange(null);
    setEditing(true);
  };

  const handleEdit = () => {
    onChange(null);
    setEditing(true);
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <PenLine size={16} color={colors.primary} />
        <Text className="ml-2 text-sm font-bold text-dhe-text">Assinatura do cliente</Text>
      </View>

      {editing ? (
        <View className="overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
          <View style={{ height: 180 }}>
            <SignatureCanvas
              ref={ref}
              onOK={handleOK}
              onEmpty={() => onChange(null)}
              webStyle={signatureWebStyle}
              backgroundColor={colors.elevated}
              penColor={colors.text}
              descriptionText=""
              clearText=""
              confirmText=""
              autoClear={false}
            />
          </View>
          <View className="flex-row gap-2 border-t border-dhe-border p-3">
            <Pressable
              onPress={handleClear}
              className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-card py-3"
            >
              <Trash2 size={16} color={colors.textMuted} />
              <Text className="ml-2 text-sm font-semibold text-dhe-textSecondary">Limpar</Text>
            </Pressable>
            <Pressable
              onPress={() => ref.current?.readSignature()}
              className="flex-1 items-center justify-center rounded-xl bg-dhe-primary py-3"
            >
              <Text className="text-sm font-bold text-dhe-bg">Confirmar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="overflow-hidden rounded-2xl border border-dhe-border bg-dhe-elevated">
          {value && (
            <Image
              source={{ uri: value }}
              style={{ height: 120, width: "100%" }}
              contentFit="contain"
            />
          )}
          <Pressable
            onPress={handleEdit}
            className="items-center border-t border-dhe-border py-3"
          >
            <Text className="text-sm font-semibold text-dhe-primary">Alterar assinatura</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
