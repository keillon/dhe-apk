import { useRef } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Printer, Share2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  ErrorState,
  Loading,
  QrPrintCard,
  Screen,
} from "@/components";
import { useEquipment, useRequireAdmin } from "@/hooks";
import { buildQrPrintHtml, printQrPdf, shareQrPdf } from "@/utils/qr-print";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

export default function QrPrintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: equipment, isLoading, error, refetch } = useEquipment(id);
  const cardRef = useRef<View>(null);

  const handlePrint = async () => {
    if (!equipment) return;
    try {
      await printQrPdf(await buildQrPrintHtml(equipment));
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    }
  };

  const handleShare = async () => {
    if (!equipment) return;
    try {
      await shareQrPdf(await buildQrPrintHtml(equipment), `QR-${equipment.qr_code}`);
      feedback.toast.success("PDF pronto para compartilhar.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao compartilhar PDF."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error || !equipment) {
    return <ErrorState onRetry={refetch} message="Equipamento não encontrado." />;
  }

  return (
    <Screen scroll>
      <BackHeader title="Imprimir QR Code" />

      <View className="mb-6 items-center">
        <QrPrintCard
          ref={cardRef}
          qrCode={equipment.qr_code}
          equipmentName={equipment.nome}
          clientName={equipment.cliente?.empresa ?? equipment.empresa}
          patrimonio={equipment.patrimonio}
          localizacao={equipment.localizacao}
        />
      </View>

      <Text className="mb-6 text-center text-sm leading-6 text-dhe-textSecondary">
        O QR Code contém somente <Text className="font-bold text-dhe-primary">{equipment.qr_code}</Text>.
        Todas as informações são carregadas do banco ao escanear.
      </Text>

      <Button
        title="Imprimir"
        onPress={handlePrint}
        fullWidth
        size="lg"
        icon={<Printer size={20} color={colors.bg} />}
        className="mb-3"
      />
      <Button
        title="Compartilhar PDF"
        onPress={handleShare}
        variant="secondary"
        fullWidth
        size="lg"
        icon={<Share2 size={20} color={colors.text} />}
      />
    </Screen>
  );
}
