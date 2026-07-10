import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Keyboard, QrCode, X, Zap, ZapOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Button, Input, Loading } from "@/components";
import { api } from "@/services/api";
import { colors } from "@/theme";

type ScanMode = "camera" | "manual";

const useModernScanner = CameraView.isModernBarcodeScannerAvailable;

function normalizeQrCode(value: string): string {
  return value.trim().toUpperCase();
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>("camera");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();
  const lookupInFlight = useRef(false);
  const scannerOpenRef = useRef(false);
  const hasAutoLaunched = useRef(false);

  useEffect(() => {
    if (mode === "camera" && permission && !permission.granted) {
      requestPermission();
    }
  }, [mode, permission, requestPermission]);

  const lookupEquipment = useCallback(
    async (rawCode: string) => {
      const code = normalizeQrCode(rawCode);

      if (!code) {
        setError("Digite o código do QR Code.");
        return;
      }

      if (lookupInFlight.current) return;

      lookupInFlight.current = true;
      setScanned(true);
      setLoading(true);
      setError("");

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const equipment = await api.getEquipmentByQrCode(code);

        if (equipment) {
          router.replace(`/equipment/${equipment.id}`);
        } else {
          setError(`Equipamento "${code}" não encontrado no banco de dados.`);
          setScanned(false);
        }
      } catch {
        setError("Erro ao buscar equipamento. Tente novamente.");
        setScanned(false);
      } finally {
        setLoading(false);
        lookupInFlight.current = false;
      }
    },
    [router]
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned || loading || mode !== "camera") return;
      void lookupEquipment(data);
    },
    [scanned, loading, mode, lookupEquipment]
  );

  const openModernScanner = useCallback(async () => {
    if (lookupInFlight.current || scannerOpenRef.current) return;

    setError("");
    scannerOpenRef.current = true;
    setScannerOpen(true);

    try {
      await CameraView.launchScanner({ barcodeTypes: ["qr"] });
    } catch {
      scannerOpenRef.current = false;
      setScannerOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!useModernScanner || mode !== "camera" || !permission?.granted) return;

    const subscription = CameraView.onModernBarcodeScanned((event) => {
      scannerOpenRef.current = false;
      setScannerOpen(false);
      handleBarCodeScanned(event);
    });

    return () => subscription.remove();
  }, [mode, permission?.granted, handleBarCodeScanned]);

  useEffect(() => {
    if (!useModernScanner || mode !== "camera" || !permission?.granted || hasAutoLaunched.current) {
      return;
    }

    hasAutoLaunched.current = true;
    void openModernScanner();
  }, [mode, permission?.granted, openModernScanner]);

  const handleManualSubmit = () => {
    void lookupEquipment(manualCode);
  };

  const switchMode = (next: ScanMode) => {
    if (next === "manual") {
      setTorchEnabled(false);
      scannerOpenRef.current = false;
      setScannerOpen(false);
    }

    setMode(next);
    setError("");
    setScanned(false);

    if (next === "camera") {
      hasAutoLaunched.current = false;
    }
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
              onPress={() => router.back()}
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

  if (useModernScanner) {
    return (
      <SafeAreaView className="flex-1 bg-dhe-bg">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Text className="text-lg font-bold text-dhe-text">Escanear QR Code</Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-dhe-overlay p-2"
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-5">
          <QrCode size={72} color={colors.primary} />
          <Text className="mt-6 text-center text-base text-dhe-text">
            {scannerOpen
              ? "Aponte para o QR Code do equipamento"
              : "Toque abaixo para abrir o scanner"}
          </Text>
          <Text className="mt-2 text-center text-sm text-dhe-textSecondary">
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
            title="Abrir scanner"
            onPress={openModernScanner}
            loading={scannerOpen && loading}
            fullWidth
            size="lg"
            icon={<Camera size={22} color={colors.bg} />}
          />

          <Button
            title="Digitar código manualmente"
            variant="secondary"
            onPress={() => switchMode("manual")}
            icon={<Keyboard size={18} color={colors.text} />}
            fullWidth
            className="mt-3"
          />
        </View>
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
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
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
              onPress={() => router.back()}
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
