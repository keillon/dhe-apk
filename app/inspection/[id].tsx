import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pencil, Trash2, Share2, Printer } from "lucide-react-native";
import {
  Card,
  Loading,
  ErrorState,
  InspectionDetailContent,
  Button,
  BackHeader,
  PageContainer,
} from "@/components";
import { useInspection, useDeleteInspection } from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import { formatDateTime, getApiErrorMessage, isAdmin } from "@/utils";
import { printInspectionPdf, shareInspectionPdf } from "@/utils/inspection-report";
import { colors } from "@/theme";

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const admin = isAdmin(user);
  const { data: inspection, isLoading, error, refetch } = useInspection(id);
  const deleteInspection = useDeleteInspection();
  const [exporting, setExporting] = useState<"share" | "print" | null>(null);

  const handleExportPdf = async () => {
    if (!inspection) return;
    setExporting("share");
    try {
      await shareInspectionPdf(inspection);
      feedback.toast.success("PDF pronto para compartilhar.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao exportar PDF."));
    } finally {
      setExporting(null);
    }
  };

  const handlePrintPdf = async () => {
    if (!inspection) return;
    setExporting("print");
    try {
      await printInspectionPdf(inspection);
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async () => {
    if (!inspection) return;

    const confirmed = await feedback.choose(
      "Excluir inspeção",
      "Deseja remover esta inspeção permanentemente?",
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir", value: "delete", style: "destructive" },
      ]
    );

    if (confirmed !== "delete") return;

    try {
      await deleteInspection.mutateAsync(inspection.id);
      feedback.toast.success("Inspeção removida.");
      router.replace(`/equipment/history/${inspection.equipamento_id}`);
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover inspeção."));
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error || !inspection) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Detalhes da Inspeção</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            {formatDateTime(inspection.created_at)} • {inspection.tecnico?.nome}
          </Text>

          <View className="mb-4 gap-3">
            <Button
              title="Compartilhar PDF"
              variant="secondary"
              onPress={() => void handleExportPdf()}
              loading={exporting === "share"}
              disabled={exporting !== null}
              fullWidth
              icon={<Share2 size={18} color={colors.text} />}
            />
            <Button
              title="Imprimir PDF"
              variant="outline"
              onPress={() => void handlePrintPdf()}
              loading={exporting === "print"}
              disabled={exporting !== null}
              fullWidth
              icon={<Printer size={18} color={colors.primary} />}
            />
          </View>

          {admin && (
            <View className="mb-4 flex-row gap-3">
              <Button
                title="Editar"
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<Pencil size={16} color={colors.primary} />}
                onPress={() => router.push(`/inspection/edit/${inspection.id}`)}
              />
              <Button
                title="Excluir"
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<Trash2 size={16} color={colors.danger} />}
                onPress={handleDelete}
                loading={deleteInspection.isPending}
              />
            </View>
          )}

          <Card className="mb-8">
            <InspectionDetailContent inspection={inspection} showHeader={false} />
          </Card>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
