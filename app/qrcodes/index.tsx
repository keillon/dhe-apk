import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  Printer,
  Share2,
  QrCode,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckSquare,
  Square,
} from "lucide-react-native";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<"print" | "share" | null>(null);
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

  const selectedEquipments = useMemo(
    () => filtered.filter((eq) => selectedIds.has(eq.id)),
    [filtered, selectedIds]
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((eq) => selectedIds.has(eq.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const eq of filtered) next.delete(eq.id);
        return next;
      });
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      for (const eq of filtered) next.add(eq.id);
      return next;
    });
  };

  const handlePrintSelected = async () => {
    if (!selectedEquipments.length) {
      feedback.toast.warning("Selecione ao menos um QR Code.");
      return;
    }

    setBulkBusy("print");
    try {
      await printQrPdf(await buildBulkQrPrintHtml(selectedEquipments));
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao imprimir PDF."));
    } finally {
      setBulkBusy(null);
    }
  };

  const handleShareSelected = async () => {
    if (!selectedEquipments.length) {
      feedback.toast.warning("Selecione ao menos um QR Code.");
      return;
    }

    setBulkBusy("share");
    try {
      await shareQrPdf(await buildBulkQrPrintHtml(selectedEquipments), "QR Codes DHE");
      feedback.toast.success("PDF pronto para compartilhar.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao compartilhar PDF."));
    } finally {
      setBulkBusy(null);
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
      const result = await confirmAndDeleteEquipment({
        id: equipment.id,
        name: equipment.nome,
        deleteFn: (args) => deleteEquipment.mutateAsync(args),
      });
      if (result === "deleted") {
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(equipment.id);
          return next;
        });
      }
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
      subtitle="Selecione quais códigos deseja imprimir ou compartilhar."
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
        <>
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              onPress={toggleSelectAllFiltered}
              className="flex-row items-center gap-2 py-2"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: allFilteredSelected }}
            >
              {allFilteredSelected ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text className="text-sm font-semibold text-dhe-text">
                {allFilteredSelected ? "Limpar seleção" : "Selecionar todos"}
              </Text>
            </Pressable>
            <Text className="text-sm text-dhe-textSecondary">
              {selectedEquipments.length} selecionado
              {selectedEquipments.length === 1 ? "" : "s"}
            </Text>
          </View>

          <View className="mb-6 flex-row gap-3">
            <Button
              title={
                isSmallPhone
                  ? `Imprimir (${selectedEquipments.length})`
                  : `Imprimir selecionados (${selectedEquipments.length})`
              }
              onPress={() => void handlePrintSelected()}
              loading={bulkBusy === "print"}
              disabled={selectedEquipments.length === 0}
              variant="primary"
              className="flex-1"
              icon={<Printer size={18} color={colors.bg} />}
            />
            <Button
              title={
                isSmallPhone
                  ? `PDF (${selectedEquipments.length})`
                  : `Compartilhar (${selectedEquipments.length})`
              }
              onPress={() => void handleShareSelected()}
              loading={bulkBusy === "share"}
              disabled={selectedEquipments.length === 0}
              variant="secondary"
              className="flex-1"
              icon={<Share2 size={18} color={colors.text} />}
            />
          </View>
        </>
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
        filtered.map((eq) => {
          const selected = selectedIds.has(eq.id);

          return (
            <Card
              key={eq.id}
              className={`mb-4 ${selected ? "border border-dhe-primary/50" : ""}`}
            >
              <View className="flex-row items-start">
                <Pressable
                  onPress={() => toggleSelect(eq.id)}
                  className="mr-3 mt-1 p-1"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Selecionar ${eq.qr_code}`}
                >
                  {selected ? (
                    <CheckSquare size={22} color={colors.primary} />
                  ) : (
                    <Square size={22} color={colors.textMuted} />
                  )}
                </Pressable>

                <Pressable
                  className="flex-1 flex-row items-center"
                  onPress={() => router.push(`/qrcodes/print/${eq.id}` as Href)}
                >
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-dhe-primary/20">
                    <QrCode size={28} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-dhe-text">{eq.qr_code}</Text>
                    <Text className="mt-1 text-sm text-dhe-textSecondary">{eq.nome}</Text>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      {[eq.localizacao, eq.cliente?.empresa ?? eq.empresa]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </Pressable>
              </View>

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
          );
        })
      )}
    </Screen>
  );
}
