import { useState, useEffect } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, QrCode } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Loading } from "@/components";
import { api } from "@/services/api";
import { colors } from "@/theme";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setError("");

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const equipment = await api.getEquipmentByQrCode(data.trim());

      if (equipment) {
        router.replace(`/equipment/${equipment.id}`);
      } else {
        setError(`Equipamento "${data}" não encontrado no banco de dados.`);
        setScanned(false);
      }
    } catch {
      setError("Erro ao buscar equipamento. Tente novamente.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <Loading fullScreen />;

  if (!permission.granted) {
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
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-dhe-bg">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Text className="text-lg font-bold text-dhe-text">Escanear QR Code</Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-dhe-overlay p-2"
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
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

        {(loading || error) && (
          <View className="mx-5 mb-8 rounded-2xl bg-dhe-overlay p-4">
            {loading && (
              <Text className="text-center text-dhe-text">Buscando equipamento...</Text>
            )}
            {error && (
              <Text className="text-center text-dhe-danger">{error}</Text>
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
