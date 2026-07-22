import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Pencil, Printer, Share2, Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  ErrorState,
  Loading,
  QrPrintCard,
  Screen,
} from "@/components";
import { useDeleteEquipment, useEquipment, useRequireAdmin } from "@/hooks";
import { buildQrPrintHtml, printQrPdf, shareQrPdf } from "@/utils/qr-print";
import { feedback } from "@/services/feedback";
import { confirmAndDeleteEquipment, getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

export default function QrPrintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: equipment, isLoading, error, refetch } = useEquipment(id);
  const deleteEquipment = useDeleteEquipment();
  const cardRef = useRef<View>(null);
  const [busyAction, setBusyAction] = useState<"print" | "share" | "delete" | null>(null);

  const handlePrint = async () => {
    if (!equipment) return;
    setBusyAction("print");
    try {
      await printQrPdf(await buildQrPrintHtml(equipment));
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    if (!equipment) return;
    setBusyAction("share");
    try {
      await shareQrPdf(await buildQrPrintHtml(equipment), `QR-${equipment.qr_code}`);
      feedback.toast.success("PDF pronto para compartilhar.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao compartilhar PDF."));
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;
    setBusyAction("delete");
    try {
      const result = await confirmAndDeleteEquipment({
        id: equipment.id,
        name: equipment.nome,
        deleteFn: (args) => deleteEquipment.mutateAsync(args),
      });
      if (result === "deleted") {
        router.replace("/qrcodes" as Href);
      }
    } finally {
      setBusyAction(null);
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error || !equipment) {
    return <ErrorState onRetry={refetch} message="Equipamento não encontrado." />;
  }

  return (
    <Screen scroll>
      <BackHeader title="QR Code" fallback="/qrcodes" />

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
        O QR Code contém somente{" "}
        <Text className="font-bold text-dhe-primary">{equipment.qr_code}</Text>.
        Todas as informações são carregadas do banco ao escanear.
      </Text>

      <Button
        title="Imprimir"
        onPress={() => void handlePrint()}
        loading={busyAction === "print"}
        fullWidth
        size="lg"
        icon={<Printer size={20} color={colors.bg} />}
        className="mb-3"
      />
      <Button
        title="Compartilhar PDF"
        onPress={() => void handleShare()}
        loading={busyAction === "share"}
        variant="secondary"
        fullWidth
        size="lg"
        icon={<Share2 size={20} color={colors.text} />}
        className="mb-3"
      />
      <Button
        title="Editar equipamento / QR"
        onPress={() => router.push(`/equipment/edit/${equipment.id}` as Href)}
        variant="outline"
        fullWidth
        size="lg"
        icon={<Pencil size={20} color={colors.primary} />}
        className="mb-3"
      />
      <Button
        title="Excluir"
        onPress={() => void handleDelete()}
        loading={busyAction === "delete"}
        variant="outline"
        fullWidth
        size="lg"
        icon={<Trash2 size={20} color={colors.danger} />}
      />
    </Screen>
  );
}
