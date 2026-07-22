import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Printer, Share2, QrCode, Plus, Pencil, Trash2, Search } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Screen,
} from "@/components";
import { useDeleteEquipment, useEquipments, useRequireAdmin, useResponsive } from "@/hooks";
import { feedback } from "@/services/feedback";
import { confirmAndDeleteEquipment, getApiErrorMessage } from "@/utils";
import { buildBulkQrPrintHtml, printQrPdf, shareQrPdf } from "@/utils/qr-print";
import { colors } from "@/theme";
import type { Equipment } from "@/types";

export default function QrCodesScreen() {
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: equipments, isLoading, error, refetch } = useEquipments();
  const deleteEquipment = useDeleteEquipment();
  const { isSmallPhone } = useResponsive();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"print" | "delete" | null>(null);

  const filtered = useMemo(() => {
    const list = equipments ?? [];
    const normalized = query.trim().toUpperCase();
    if (!normalized) return list;

    return list.filter((eq) => {
      const haystack = [
        eq.qr_code,
        eq.nome,
        eq.patrimonio,
        eq.localizacao,
        eq.tipo,
        eq.cliente?.empresa,
        eq.empresa,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();
      return haystack.includes(normalized);
    });
  }, [equipments, query]);

  const handlePrintAll = async () => {
    if (!filtered.length) return;
    try {
      await printQrPdf(await buildBulkQrPrintHtml(filtered));
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    }
  };

  const handleShareAll = async () => {
    if (!filtered.length) return;
    try {
      await shareQrPdf(await buildBulkQrPrintHtml(filtered), "QR Codes DHE");
      feedback.toast.success("PDF pronto para compartilhar.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao compartilhar PDF."));
    }
  };

  const handlePrintOne = async (equipment: Equipment) => {
    setBusyId(equipment.id);
    setBusyAction("print");
    try {
      await printQrPdf(await buildBulkQrPrintHtml([equipment]));
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const handleDelete = async (equipment: Equipment) => {
    setBusyId(equipment.id);
    setBusyAction("delete");
    try {
      await confirmAndDeleteEquipment({
        id: equipment.id,
        name: equipment.nome,
        deleteFn: (args) => deleteEquipment.mutateAsync(args),
      });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen
      title="QR Codes"
      subtitle="Busque, edite, exclua e imprima os códigos dos equipamentos."
    >
      <BackHeader />

      <Button
        title="Novo equipamento"
        onPress={() => router.push("/equipment/new")}
        icon={<Plus size={18} color={colors.bg} />}
        className="mb-4"
      />

      <View className="mb-4">
        <Input
          label="Buscar"
          value={query}
          onChangeText={setQuery}
          placeholder="QR, nome, cliente, patrimônio..."
          autoCorrect={false}
        />
        <View className="absolute right-4 top-9 opacity-50" pointerEvents="none">
          <Search size={18} color={colors.textMuted} />
        </View>
      </View>

      {filtered.length > 0 && (
        <View className="mb-6 flex-row gap-3">
          <Button
            title={isSmallPhone ? "Imprimir" : "Imprimir lista"}
            onPress={() => void handlePrintAll()}
            variant="primary"
            className="flex-1"
            icon={<Printer size={18} color={colors.bg} />}
          />
          <Button
            title={isSmallPhone ? "PDF" : "Compartilhar"}
            onPress={() => void handleShareAll()}
            variant="secondary"
            className="flex-1"
            icon={<Share2 size={18} color={colors.text} />}
          />
        </View>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? "Nenhum resultado" : "Nenhum equipamento"}
          description={
            query
              ? "Tente outro termo de busca."
              : "Cadastre equipamentos para gerar e gerenciar QR Codes."
          }
        />
      ) : (
        filtered.map((eq) => (
          <Card key={eq.id} className="mb-4">
            <Pressable onPress={() => router.push(`/qrcodes/print/${eq.id}` as Href)}>
              <View className="flex-row items-center">
                <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-dhe-primary/20">
                  <QrCode size={28} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-dhe-text">{eq.qr_code}</Text>
                  <Text className="mt-1 text-sm text-dhe-textSecondary">{eq.nome}</Text>
                  <Text className="mt-1 text-xs text-dhe-textMuted">
                    {[eq.localizacao, eq.cliente?.empresa ?? eq.empresa].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </View>
            </Pressable>

            <View className="mt-4 flex-row gap-2">
              <Button
                title="Imprimir"
                variant="secondary"
                className="flex-1"
                size="sm"
                loading={busyId === eq.id && busyAction === "print"}
                onPress={() => void handlePrintOne(eq)}
                icon={<Printer size={16} color={colors.text} />}
              />
              <Button
                title="Editar"
                variant="outline"
                className="flex-1"
                size="sm"
                onPress={() => router.push(`/equipment/edit/${eq.id}` as Href)}
                icon={<Pencil size={16} color={colors.primary} />}
              />
              <Button
                title="Excluir"
                variant="outline"
                className="flex-1"
                size="sm"
                loading={busyId === eq.id && busyAction === "delete"}
                onPress={() => void handleDelete(eq)}
                icon={<Trash2 size={16} color={colors.danger} />}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
