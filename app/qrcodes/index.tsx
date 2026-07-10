import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Printer, Share2, QrCode, Plus } from "lucide-react-native";
import { BackHeader, Button, Card, EmptyState, ErrorState, Loading, Screen } from "@/components";
import { useEquipments, useRequireAdmin } from "@/hooks";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import { buildBulkQrPrintHtml, printQrPdf, shareQrPdf } from "@/utils/qr-print";
import { colors } from "@/theme";

export default function QrCodesScreen() {
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: equipments, isLoading, error, refetch } = useEquipments();

  const handlePrintAll = async () => {
    if (!equipments?.length) return;
    try {
      await printQrPdf(buildBulkQrPrintHtml(equipments));
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    }
  };

  const handleShareAll = async () => {
    if (!equipments?.length) return;
    try {
      await shareQrPdf(buildBulkQrPrintHtml(equipments), "QR Codes DHE");
      feedback.toast.success("PDF pronto para compartilhar.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao compartilhar PDF."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen
      title="QR Codes para Impressão"
      subtitle="Gere e imprima QR Codes dos equipamentos cadastrados."
    >
      <BackHeader />

      <Button
        title="Novo equipamento"
        onPress={() => router.push("/equipment/new")}
        icon={<Plus size={18} color={colors.bg} />}
        className="mb-4"
      />

      <Card className="mb-6 border-dhe-primary/40 bg-dhe-elevated">
        <Text className="text-base font-bold text-dhe-text">Como funciona</Text>
        <Text className="mt-2 text-sm leading-6 text-dhe-textSecondary">
          1. Selecione o equipamento{"\n"}
          2. Gere o QR com o ID único{"\n"}
          3. Imprima e cole na máquina{"\n"}
          4. O técnico escaneia para registrar inspeções
        </Text>
      </Card>

      {equipments && equipments.length > 0 && (
        <View className="mb-6 flex-row gap-3">
          <Button
            title="Imprimir todos"
            onPress={handlePrintAll}
            variant="primary"
            className="flex-1"
            icon={<Printer size={18} color={colors.bg} />}
          />
          <Button
            title="Compartilhar PDF"
            onPress={handleShareAll}
            variant="secondary"
            className="flex-1"
            icon={<Share2 size={18} color={colors.text} />}
          />
        </View>
      )}

      {equipments?.length === 0 ? (
        <EmptyState
          title="Nenhum equipamento"
          description="Cadastre equipamentos no banco para gerar QR Codes."
        />
      ) : (
        equipments?.map((eq) => (
          <Pressable
            key={eq.id}
            onPress={() => router.push(`/qrcodes/print/${eq.id}` as Href)}
          >
            <Card className="mb-4 flex-row items-center">
              <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-dhe-primary/20">
                <QrCode size={28} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-dhe-text">{eq.qr_code}</Text>
                <Text className="mt-1 text-sm text-dhe-textSecondary">{eq.nome}</Text>
                <Text className="mt-1 text-xs text-dhe-textMuted">
                  {eq.cliente?.empresa ?? eq.empresa}
                </Text>
              </View>
              <Printer size={20} color={colors.textSecondary} />
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
