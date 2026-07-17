import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  Route,
} from "lucide-react-native";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageContainer,
  RefreshableScrollView,
  StatusBadge,
} from "@/components";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { formatDate, getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";
import type { DailyRoute } from "@/types";

const STATUS_LABEL: Record<DailyRoute["status"], string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const STATUS_COLOR: Record<DailyRoute["status"], string> = {
  planejada: colors.textMuted,
  em_andamento: colors.primary,
  concluida: colors.success,
};

export default function RouteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [visitingId, setVisitingId] = useState<string | null>(null);

  const { data: route, isLoading, error, refetch } = useQuery({
    queryKey: ["daily-route"],
    queryFn: () => api.getTodayRoute(),
  });

  const startMutation = useMutation({
    mutationFn: () => api.startTodayRoute(),
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-route"], data);
      feedback.toast.success("Rota iniciada.");
    },
    onError: (err) => {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao iniciar rota."));
    },
  });

  const visitMutation = useMutation({
    mutationFn: (itemId: string) => api.visitRouteItem(itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["daily-route"] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateTodayRoute(),
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-route"], data);
      feedback.toast.success("Rota regenerada com sucesso.");
    },
    onError: (err) => {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao regenerar rota."));
    },
  });

  const handleVisit = async (itemId: string) => {
    setVisitingId(itemId);
    try {
      await visitMutation.mutateAsync(itemId);
      feedback.toast.success("Visita registrada.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao registrar visita."));
    } finally {
      setVisitingId(null);
    }
  };

  const handleRegenerate = async () => {
    const confirmed = await feedback.confirm(
      "Regenerar rota",
      "Isso apaga o progresso de hoje e monta uma nova lista de equipamentos. Continuar?",
      "Regenerar"
    );
    if (!confirmed) return;
    regenerateMutation.mutate();
  };

  const openMaps = async (localizacao?: string) => {
    const query = localizacao?.trim();
    if (!query) {
      feedback.toast.warning("Este equipamento não tem localização cadastrada.");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    try {
      await Linking.openURL(url);
    } catch {
      feedback.toast.error("Não foi possível abrir o mapa.");
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  const visitedCount = route?.itens.filter((item) => item.visitado_em).length ?? 0;
  const totalCount = route?.itens.length ?? 0;
  const status = route?.status ?? "planejada";
  const canStart = status === "planejada" && totalCount > 0;
  const progressPct = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentPadding="tab"
        onRefresh={refetch}
      >
        <PageContainer>
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-1 text-2xl font-bold text-dhe-text">Rota do dia</Text>
              <Text className="text-sm text-dhe-textSecondary">
                {formatDate(route?.data)} • {visitedCount}/{totalCount} visitados
              </Text>
            </View>
            <Route size={28} color={colors.primary} />
          </View>

          <Card className="mb-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-dhe-textSecondary">Status</Text>
              <Text
                className="text-sm font-bold"
                style={{ color: STATUS_COLOR[status] }}
              >
                {STATUS_LABEL[status]}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-dhe-elevated">
              <View
                className="h-full rounded-full bg-dhe-primary"
                style={{ width: `${progressPct}%` }}
              />
            </View>
            <Text className="mt-2 text-xs text-dhe-textMuted">{progressPct}% concluído</Text>
          </Card>

          {canStart ? (
            <Button
              title="Iniciar rota"
              onPress={() => startMutation.mutate()}
              loading={startMutation.isPending}
              fullWidth
              className="mb-3"
              icon={<Play size={18} color={colors.bg} />}
            />
          ) : null}

          <Button
            title="Regenerar rota"
            variant="secondary"
            onPress={() => void handleRegenerate()}
            loading={regenerateMutation.isPending}
            fullWidth
            className="mb-6"
            icon={<RefreshCw size={18} color={colors.text} />}
          />

          {totalCount === 0 ? (
            <EmptyState
              title="Rota vazia"
              description="Nenhum equipamento disponível. Cadastre equipamentos ou toque em Regenerar."
            />
          ) : (
            route?.itens.map((item) => {
              const visited = !!item.visitado_em;
              const visiting = visitingId === item.id;

              return (
                <Card key={item.id} className="mb-4">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase text-dhe-primary">
                      Parada #{item.ordem}
                    </Text>
                    {visited ? (
                      <View className="flex-row items-center">
                        <CheckCircle2 size={16} color={colors.success} />
                        <Text className="ml-1 text-xs font-semibold text-dhe-success">
                          Visitado
                        </Text>
                      </View>
                    ) : (
                      <StatusBadge status={item.equipamento.status} />
                    )}
                  </View>

                  <Pressable onPress={() => router.push(`/equipment/${item.equipamento.id}`)}>
                    <Text className="text-base font-semibold text-dhe-text">
                      {item.equipamento.nome}
                    </Text>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      {item.equipamento.qr_code}
                    </Text>
                    <View className="mt-2 flex-row items-center">
                      <MapPin size={14} color={colors.textMuted} />
                      <Text className="ml-2 flex-1 text-sm text-dhe-textSecondary">
                        {item.equipamento.localizacao || "Sem localização"}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      {item.equipamento.cliente?.empresa ?? item.equipamento.empresa}
                    </Text>
                  </Pressable>

                  <View className="mt-4 gap-2">
                    <Button
                      title="Abrir no mapa"
                      variant="outline"
                      size="sm"
                      onPress={() => void openMaps(item.equipamento.localizacao)}
                      icon={<Navigation size={16} color={colors.primary} />}
                    />
                    <Button
                      title="Nova inspeção"
                      variant="secondary"
                      size="sm"
                      onPress={() =>
                        router.push(`/inspection/new?equipmentId=${item.equipamento.id}`)
                      }
                      icon={<ClipboardList size={16} color={colors.text} />}
                    />
                    {!visited ? (
                      <Button
                        title="Marcar como visitado"
                        size="sm"
                        onPress={() => void handleVisit(item.id)}
                        loading={visiting}
                        disabled={visiting || visitMutation.isPending}
                      />
                    ) : null}
                  </View>
                </Card>
              );
            })
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
