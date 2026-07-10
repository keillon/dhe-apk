import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Keyboard, QrCode, X, Zap, ZapOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Button, Input, Loading } from "@/components";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { colors } from "@/theme";

type ScanMode = "camera" | "manual";

function normalizeQrCode(value: string): string {
  return value.trim().toUpperCase();
}

function openEquipmentScreen(equipmentId: string) {
  const href = {
    pathname: "/equipment/[id]",
    params: { id: equipmentId },
  } as const;

  if (router.canDismiss()) {
    router.dismissTo(href);
    return;
  }

  router.push(href);
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>("camera");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const screenRouter = useRouter();
  const lookupInFlight = useRef(false);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  useEffect(() => {
    if (mode === "camera" && permission && !permission.granted) {
      requestPermission();
    }
  }, [mode, permission, requestPermission]);

  const lookupEquipment = useCallback(async (rawCode: string) => {
    const code = normalizeQrCode(rawCode);

    if (!code) {
      setError("Digite o código do QR Code.");
      return;
    }

    if (lookupInFlight.current) return;

    lookupInFlight.current = true;
    setLoading(true);
    setError("");

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const equipment = await api.getEquipmentByQrCode(code);

      if (equipment) {
        feedback.toast.success(`Equipamento ${equipment.nome} encontrado.`);
        openEquipmentScreen(equipment.id);
        return;
      }

      setError(`Equipamento "${code}" não encontrado no banco de dados.`);
      feedback.toast.error(`Código ${code} não encontrado.`);
    } catch {
      setError("Erro ao buscar equipamento. Tente novamente.");
      feedback.toast.error("Erro ao buscar equipamento.");
    } finally {
      setLoading(false);
      lookupInFlight.current = false;
    }
  }, []);

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (mode !== "camera" || loading) return;

      const code = normalizeQrCode(data);
      const now = Date.now();
      const lastScan = lastScanRef.current;

      if (lastScan?.code === code && now - lastScan.at < 2000) {
        return;
      }

      lastScanRef.current = { code, at: now };
      void lookupEquipment(code);
    },
    [loading, lookupEquipment, mode]
  );

  const handleManualSubmit = () => {
    void lookupEquipment(manualCode);
  };

  const switchMode = (next: ScanMode) => {
    if (next === "manual") {
      setTorchEnabled(false);
    }

    setMode(next);
    setError("");
    lastScanRef.current = null;
  };

  if (!permission && mode === "camera") return <Loading fullScreen />;

  if (mode === "manual") {
    return (
      <SafeAreaView className="flex-1 bg-dhe-bg">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Text className="text-lg font-bold text-dhe-text">Digitar código</Text>
            <Pressable
              onPress={() => screenRouter.back()}
              className="rounded-full bg-dhe-overlay p-2"
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <View className="flex-1 px-5 pt-6">
            <QrCode size={56} color={colors.primary} />
            <Text className="mt-4 text-base text-dhe-text">
              Informe o código impresso abaixo do QR Code
            </Text>
            <Text className="mt-1 text-sm text-dhe-textSecondary">
              Exemplo: DHE-0001
            </Text>

            <View className="mt-8">
              <Input
                label="Código do equipamento"
                value={manualCode}
                onChangeText={(text) => {
                  setManualCode(text.toUpperCase());
                  if (error) setError("");
                }}
                placeholder="DHE-0001"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleManualSubmit}
                error={error}
              />
            </View>

            <Button
              title="Buscar equipamento"
              onPress={handleManualSubmit}
              loading={loading}
              fullWidth
            />

            {permission?.granted && (
              <Button
                title="Usar câmera"
                variant="outline"
                onPress={() => switchMode("camera")}
                icon={<Camera size={18} color={colors.primary} />}
                fullWidth
                className="mt-3"
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-dhe-bg px-5">
        <QrCode size={64} color={colors.primary} />
        <Text className="mt-4 text-center text-lg text-dhe-text">
          Precisamos de acesso à câmera para escanear QR Codes
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-6 rounded-2xl bg-dhe-primary px-8 py-4"
        >
          <Text className="font-semibold text-dhe-bg">Permitir câmera</Text>
        </Pressable>
        <Button
          title="Digitar código manualmente"
          variant="outline"
          onPress={() => switchMode("manual")}
          icon={<Keyboard size={18} color={colors.primary} />}
          fullWidth
          className="mt-4"
        />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-dhe-bg">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      <SafeAreaView className="flex-1" pointerEvents="box-none">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Text className="text-lg font-bold text-dhe-text">Escanear QR Code</Text>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setTorchEnabled((current) => !current)}
              className="rounded-full bg-dhe-overlay p-2"
              accessibilityLabel={torchEnabled ? "Desligar flash" : "Ligar flash"}
            >
              {torchEnabled ? (
                <Zap size={22} color={colors.primary} fill={colors.primary} />
              ) : (
                <ZapOff size={22} color={colors.text} />
              )}
            </Pressable>

            <Pressable
              onPress={() => screenRouter.back()}
              className="rounded-full bg-dhe-overlay p-2"
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <View className="h-64 w-64 rounded-3xl border-2 border-dhe-primary">
            <View className="absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-dhe-primary" />
            <View className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-dhe-primary" />
            <View className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-dhe-primary" />
            <View className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-dhe-primary" />
          </View>
          <Text className="mt-6 text-center text-sm text-dhe-text">
            Aponte para o QR Code do equipamento
          </Text>
          <Text className="mt-1 text-center text-xs text-dhe-textSecondary">
            O QR Code contém apenas o ID — os dados vêm do banco
          </Text>
        </View>

        <View className="px-5 pb-8">
          {(loading || error) && (
            <View className="mb-4 rounded-2xl bg-dhe-overlay p-4">
              {loading && (
                <Text className="text-center text-dhe-text">Buscando equipamento...</Text>
              )}
              {error && <Text className="text-center text-dhe-danger">{error}</Text>}
            </View>
          )}

          <Button
            title="Digitar código manualmente"
            variant="secondary"
            onPress={() => switchMode("manual")}
            icon={<Keyboard size={18} color={colors.text} />}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
